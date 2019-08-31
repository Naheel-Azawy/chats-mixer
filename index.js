const print = s => console.log(s);
const fs    = require('fs-extra');
const mix   = require("./src/base/mix.js");
const build = require("./src/base/build.js");

// https://stackoverflow.com/a/10357818/3825872
function get_pass(prompt, callback) {
    var BACKSPACE = String.fromCharCode(127);

    if (prompt) {
      process.stdout.write(prompt);
    }

    var stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    var password = '';
    stdin.on('data', function (ch) {
        ch = ch.toString('utf8');

        switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
            // They've finished typing their password
            process.stdout.write('\n');
            stdin.setRawMode(false);
            stdin.pause();
            callback(password);
            break;
        case "\u0003":
            // Ctrl-C
            callback();
            break;
        case BACKSPACE:
            password = password.slice(0, password.length - 1);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(prompt);
            process.stdout.write(password.split('').map(function () {
              return '*';
            }).join(''));
            break;
        default:
            // More passsword characters
            process.stdout.write('*');
            password += ch;
            break;
        }
    });
}

function run(input, output, pass) {
    print(">>> BUILDING JSON");
    let j = mix(input);
    fs.writeFileSync(output + "/chats.json", JSON.stringify(j, null, 2));
    print(">>> BUILDING ENCRYPTED HTML");
    let h = build(j, pass);
    fs.writeFileSync(output + "/chats.html", h);
}

function main() {
    let input  = process.argv[2];
    let output = process.argv[3];
    if (input && output &&
        fs.lstatSync(input).isDirectory() &&
        fs.lstatSync(output).isDirectory()) {
        fs.removeSync(output);
        fs.mkdirp(output);
        get_pass("Enter password: ", pass => {
            if (pass) {
                run(input, output, pass );
            }
        });
    } else {
        print("usage: chats-mixer INPUT_DIR OUTPUT_DIR");
        process.exit(1);
    }
}

main();
