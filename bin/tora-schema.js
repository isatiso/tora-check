#!/usr/bin/env node

const process = require("process")
const {program} = require("commander")

const pkg = require("../package.json")

const {generateSchema} = require('../lib')

program.version(pkg.version)
    .option('-t, --typename <typename>', '需要生成 Schema 的类型名称', 'global.ToraConfigSchema')
    .option('-o, --output <filepath>', '输出文件位置', 'schema/config-schema.json')
    .parse(process.argv)

generateSchema(program.opts())
