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

export function loadConfig(file: string) {
    const file_path = path.resolve(`config/${file}`)
    try {
        let data
        if (file_path.endsWith('.json')) {
            data = JSON.parse(fs.readFileSync(file_path).toString('utf-8'))
        } else if (file_path.endsWith('.yaml')) {
            data = yaml.load(fs.readFileSync(file_path, 'utf8'))
        } else {
            console.error(`Unknown file "${file_path}"`)
            process.exit(1)
        }
        if (!data) {
            console.error(`File: "${file}" is empty.`)
            process.exit(1)
        }
        return data
    } catch (e) {
        console.error(`Parse config file failed: ${e.message}`)
        process.exit(1)
    }
}

export function checkSingleConfig(file: string, validator: ValidateFunction<unknown>) {
    const file_data = loadConfig(file)
    if (!validator(file_data)) {
        console.log('Config File Check Failed:')
        console.log(`    File -> ${path.resolve('config/' + file)}`)
        validator.errors?.forEach(err => {
            // const dataPath = '$' + err.dataPath.replace(/\//g, '.')
            console.log(err)
            console.log(`    ERROR -> "${err}" ${err.message}.`)
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
    if (stats.isFile()) {
        checkSingleConfig(target, validate)
    } else if (stats.isDirectory()) {
        for (const d of fs.readdirSync(target, { withFileTypes: true })) {
            if (!d.isFile()) {
                continue
            }
            checkSingleConfig(`${target}/${d.name}`, validate)
        }
    } else {
        console.log(`Specified target "${options.target}" is not file either not directory.`)
        process.exit(1)
    }
}
