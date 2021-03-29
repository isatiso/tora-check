#!/usr/bin/env node

const {program} = require('commander')
const process = require('process')

const pkg = require("../package.json")

const {checkConfig} = require('../lib')

program.version(pkg.version)
    .option('-s, --schema <schemaname>', 'Schema 文件位置', 'schema/config-schema.json')
    .option('-t, --target <target>', '需要检查的配置文件或目录', 'config')
    .parse(process.argv)

checkConfig(program.opts())
