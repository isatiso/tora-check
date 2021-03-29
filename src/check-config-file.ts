import Ajv, { ValidateFunction } from 'ajv'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import process from 'process'

export function readSchema(schema_path?: string) {
    if (!schema_path || !fs.existsSync(path.resolve(schema_path))) {
        console.error(`Schema file ${schema_path} not exits.`)
        process.exit(1)
    }
    try {
        return JSON.parse(fs.readFileSync(path.resolve(schema_path)).toString('utf8'))
    } catch (e) {
        console.error(`Parse schema file failed: ${e.message}`)
        process.exit(1)
    }
}

export function loadConfig(file_path: string) {
    try {
        let data
        if (file_path.endsWith('.json')) {
            data = JSON.parse(fs.readFileSync(file_path).toString('utf-8'))
        } else if (file_path.endsWith('.yaml') || file_path.endsWith('.yml')) {
            data = yaml.load(fs.readFileSync(file_path, 'utf8'))
        } else {
            console.error(`Unknown file "${file_path}"`)
            process.exit(1)
        }
        if (!data) {
            console.error(`File: "${file_path}" is empty.`)
            process.exit(1)
        }
        return data
    } catch (e) {
        console.error(`Parse config file failed: ${e.message}`)
        process.exit(1)
    }
}

export function checkSingleConfig(file_path: string, validator: ValidateFunction<unknown>) {
    const file_data = loadConfig(file_path)
    if (!validator(file_data)) {
        console.log('Config File Check Failed:')
        console.log(`    File -> ${file_path}`)
        validator.errors?.forEach(err => {
            if (err.params.missingProperty) {
                const data_path = [err.instancePath, err.params.missingProperty].join('/')
                const json_path = '$' + data_path.replace(/\//g, '.')
                console.log(`    ERROR -> "${json_path}" is missing.`)
            } else {
                const json_path = '$' + err.instancePath.replace(/\//g, '.')
                console.log(`    ERROR -> "${json_path}" ${err.message}.`)
            }
        })
        process.exit(1)
    }
}

export function checkConfig(options: {
    schema: string
    target: string
}) {

    const schema = readSchema(options.schema)
    const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema)

    const target = path.resolve(options.target)
    if (!fs.existsSync(target)) {
        console.log(`Specified target "${options.target}" not exists.`)
        process.exit(1)
    }

    const stats = fs.lstatSync(target)
    if (stats.isFile() && target.endsWith('.json')) {
        checkSingleConfig(target, validate)
    } else if (stats.isDirectory()) {
        let deal = false
        for (const d of fs.readdirSync(target, { withFileTypes: true })) {
            if (d.name.endsWith('.json') || d.name.endsWith('.yaml') || d.name.endsWith('.yml')) {
                deal = true
                checkSingleConfig(`${target}/${d.name}`, validate)
            }
        }
        if (!deal) {
            console.log(`No json or yaml file in specified directory "${target}".`)
            process.exit(1)
        }
    } else {
        console.log(`Specified target "${options.target}" is not file either not directory.`)
        process.exit(1)
    }
}
