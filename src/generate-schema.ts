import fs from 'fs'
import { dirname } from 'path'
import { generateSchema as _generateSchema, programFromConfig } from 'typescript-json-schema'

export function generateSchema(options: {
    typename: string
    output: string
}) {
    const typename = options.typename
    const output = options.output

    const pg = programFromConfig('tsconfig.json')
    const schema = _generateSchema(pg, typename, { required: true })

    fs.mkdirSync(dirname(output), { recursive: true })

    if (schema) {
        fs.writeFileSync(output, JSON.stringify(schema, null, 4))
    }
}
