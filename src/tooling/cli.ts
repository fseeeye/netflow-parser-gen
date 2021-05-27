import * as path from "path"
import * as fs from "fs"
import * as yargs from "yargs"
import { BuiltinProtocols } from "../protocols"
interface Args {
    output: string
}

function validatePath(value: string) {
    const absolutePath = path.resolve(value)
    return (fs.existsSync(absolutePath) === true)
}

function generateParser(outputDir: string) {
    BuiltinProtocols.forEach(p => {
        p.generateCode(outputDir)
    })
}

function main() {
    const argv = yargs
        .command('generate', 'generate parser', (yargs) => {
            return yargs.option('output', {
                alias: 'o',
                type: 'string',
                demandOption: true,
                description: 'output directory for generated code'
            })
        },
            (argv) => {
                generateParser(argv.output)
            })
        .help()
        .check((argv: any) => {
            if (validatePath(argv.output) === false) {
                return false
            }
            return true
        })
        .argv

}

main()