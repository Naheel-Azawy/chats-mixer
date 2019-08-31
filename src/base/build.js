const fs  = require('fs');
const compress = require("../compress.js");
const print = s => console.log(s);

function build_html(json, pass) {
    let i = fs.readFileSync("./src/client/index.html").toString();

    function replace_script(name, text) {
        i = i.replace(`<script src="${name}"></script>`,
                      "<script>" + text + "</script>");
    }

    function replace_script_f(name, dir) {
        let text = fs.readFileSync(dir + name).toString();
        replace_script(name, text);
    }

    replace_script_f("compress.js", "./src/");
    replace_script_f("main.js", "./src/client/");

    let j = JSON.stringify(json);
    j = compress.c(j, pass);
    replace_script("data.js", `var enc_data = "${j}";`);
    return i;
}

module.exports = build_html;
