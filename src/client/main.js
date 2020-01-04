const print = s => console.log(s);

const MAX_CHATS = 50;

const PASS_HTML = `
<h3>Enter password:</h3>
<input id="pass" type="password">
<button id="passgo">GO</button><br>
<div id="info"></div>
`;

const MAIN_HTML = `
<h1 id="title" style="text-align: left"></h1>
<h4 id="stats" style="text-align: left"></h4>
<table id="search_table"></table>
<br>
<button id="reset">RESET</button>
<button id="go">GO</button>
<br><br>
<table id="top_table">
    <tr>
        <td><a href="#" onclick="move(-2)">&lt;&lt;--</a></td>
        <td><a href="#" onclick="move(-1)">&lt; prev</a></td>
        <td><a href="#" onclick="move( 1)">next &gt;</a></td>
        <td><a href="#" onclick="move( 2)">--&gt;&gt;</a></td>
    </tr>
</table>
<div id="msgs"></div>
<br><br>
<table>
    <tr>
        <td><a href="#" onclick="move(-2)">&lt;&lt;--</a></td>
        <td><a href="#" onclick="move(-1)">&lt; prev</a></td>
        <td><a href="#" onclick="move( 1)">next &gt;</a></td>
        <td><a href="#" onclick="move( 2)">--&gt;&gt;</a></td>
    </tr>
</table>
`;

const main_div = document.getElementById("main");

let msgs;
let from;
let to;
let search;
let go;
let top_table;
let search_table;
let from_tick;
let to_tick;
let sources_elems;

let names;
let sources;
let chats;

let search_arr = undefined;
let count;
let first_i;
let last_i;
let full_search = false;

function format_date(time) {
    return new Date(time).toLocaleString("en-US", {
        hour12:  true,
        weekday: "short",
        month:   "short",
        day:     "numeric",
        year:    "numeric",
        hour:    "numeric",
        minute:  "numeric"
    });
}

function title() {
    return `${names.to.real} and ${names.from.real} chats from
${format_date(chats[0].time)} till
${format_date(chats[chats.length - 1].time)}${names.title_extra}`;
}

function stats() {
    let m = { msgs: 0, chars: 0 };
    let n = { msgs: 0, chars: 0 };
    for (let msg of chats) {
        if (msg.sender === names.to.real) {
            ++m.msgs;
            if (msg.text) m.chars += msg.text.length;
        } else if (msg.sender === names.from.real) {
            ++n.msgs;
            if (msg.text) n.chars += msg.text.length;
        } else {
            print(">>>>>>> WHAT IS THIS????? >>>>>>> " + msg);
            process.exit(1);
        }
    }
    return `Total number of messages: ${chats.length}
Messages from ${names.to.real}:  ${m.msgs} (${m.chars} characters)
Messages from ${names.from.real}: ${n.msgs} (${n.chars} characters)`;
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function get_time(dom, end_of_day) {
    if (!dom.value || dom.value === "") return undefined;
    let time = end_of_day ? " 23:59:59" : " 00:00:00";
    return new Date(dom.value + time).getTime();
}

function time2yyyy(time) {
    return new Date(time).toISOString().slice(0,10);
}

function match_highlight(txt, target) {
    var re = new RegExp('(' + target + ')', 'gi');
    if (!txt || typeof txt !== 'string' || txt.match(re) === null)
        return undefined;
    return txt.replace(re, "<mark>$1</mark>");
}

function msg2html(i, m, txt) {
    if (!txt) txt = m.text;
    return `
      <div style="margin: 10px">
      <div align="right" style="margin-right: 5px">
      <font size="2">
      ${m.sender} - ${format_date(m.time)} (${m.app})
      <a href="#" onclick="go_to_num(${i})">#${i+1}</a>
      </font>
      </div>
      <hgroup class="${m.sender == names.to.real ? "bubble1" : "bubble2"}">
      ${txt || "&gt;Not supported message type&lt;"}
      </hgroup>
      </div>
      `;
}

function add_chats(src, q, n) {
    let from_t = get_time(from);
    let to_t   = get_time(to, true);

    if (to_t < from_t) {
        to.value = from.value;
        to_t = get_time(to, true);
    }

    msgs.innerHTML = '';
    count = 0;

    let started = false;
    let m;
    for (let i = 0; i < src.length; ++i) {
        m = src[i];
        if (m.time < from_t) continue;
        if (m.time > to_t  ) break;
        if (n && i < n     ) continue;
        if (!started) {
            first_i = i;
            started = true;
        }
        if (count > MAX_CHATS - 1) {
            last_i = i;
            break;
        }
        ++count;
        msgs.innerHTML += msg2html(
            m.i || i, m, q ? m.h_text : m.text);
    }

    msgs.innerHTML += `
<br><div style="text-align: right; margin-right: 5px">
<font size="2">
(${first_i + 1} to ${first_i + count}) / ${src.length}
</font></div>`;
}

function reset() {
    from.value = time2yyyy(chats[0].time);
    to.value = time2yyyy(chats[chats.length - 1].time);
    search.value = "";
    search_arr = undefined;
    count   = 0;
    first_i = 0;
    last_i  = chats.length - 1;
}

async function go_to_num(n) {
    reset();
    add_chats(chats, false, n);
    await sleep(50);
    top_table.scrollIntoView();
}

async function move(dir) {
    let n = 0;
    let src = search_arr || chats;

    switch (dir) {
    case -2: n = 0;                      break;
    case  2: n = src.length - MAX_CHATS; break;
    case -1: n = first_i - MAX_CHATS;    break;
    case  1: n = last_i - 1;             break;
    }

    if (n > src.length - 1)
        n = src.length - MAX_CHATS - 1;
    if (n < 0)
        n = 0;

    add_chats(src, search_arr ? true : false, n);

    await sleep(50);

    switch (dir) {
    case  2:
    case -1:
        window.scrollTo(0, document.body.scrollHeight);
        break;
    case -2:
    case  1:
        top_table.scrollIntoView();
        break;
    }
}

async function go_run() {
    let q = search.value.trim();
    if (q && q.length === 0) q = undefined;
    if (q || full_search) {
        if (q.startsWith("#")) {
            try {
                let n = Number(q.substring(1)) - 1;
                if (n >= 0 && n < chats.length) {
                    go_to_num(n);
                    return;
                }
            } catch (e) {}
        }
        msgs.innerHTML = '<br>SEARCHING...';
        await sleep(100);
        search_arr = [];
        let match;
        let m;

        if (full_search) {
            for (let i = 0; i < chats.length; ++i) {
                m = chats[i];
                if ((m.sender === names.from.real && !from_tick.checked) ||
                    (m.sender === names.to.real && !to_tick.checked) ||
                    (!sources_elems[m.app].checked)) {
                    continue;
                }
                if (q) {
                    match = match_highlight(m.text, q);
                    if (match) {
                        m.i = i;
                        m.h_text = match;
                        search_arr.push(m);
                    }
                } else {
                    m.i = i;
                    search_arr.push(m);
                }
            }
        } else {
            for (let i = 0; i < chats.length; ++i) {
                m = chats[i];
                match = match_highlight(m.text, q);
                if (match) {
                    m.i = i;
                    m.h_text = match;
                    search_arr.push(m);
                }
            }
        }
        add_chats(search_arr, q ? true : false);
    } else {
        search_arr = undefined;
        add_chats(chats);
    }
}

function on_enter(elem, action_elem) {
    elem.addEventListener("keyup", event => {
        if (event.keyCode === 13) {
            event.preventDefault();
            action_elem.click();
        }
    });
}

function build_search_table(full) {

    let html = `
<tr> <td>From</td>   <td><input id="from"   type="date"></td> </tr>
<tr> <td>To</td>     <td><input id="to"     type="date"></td> </tr> <tr></tr>
<tr> <td>Search</td> <td><input id="search" type="text"></td>
<td><button onclick="build_search_table(!full_search)">
${full ? "LESS" : "MORE"}</button></td>
</tr>
<tr></tr>
`;

    if (full) {
        full_search = true;
        html += `
<tr><td>Sender</td><td>
  <input id="to_tick" type="checkbox" checked> ${names.to.real}
</td></tr>
<tr><td></td><td>
  <input id="from_tick" type="checkbox" checked> ${names.from.real}
</td></tr>
<tr></tr>
`;

        for (let i in sources) {
            html += `
<tr><td>${i == 0 ? "Sources" : ''}</td><td>
  <input id="${sources[i]}_tick" type="checkbox" checked> ${sources[i]}
</td></tr>
`;
        }
    } else {
        full_search = false;
    }

    let old_from;
    let old_to;
    let old_search;

    if (search) {
        old_from = from.value;
        old_to = to.value;
        old_search = search.value;
    }

    search_table.innerHTML = html;

    from      = document.getElementById("from");
    to        = document.getElementById("to");
    search    = document.getElementById("search");
    from_tick = document.getElementById("from_tick");
    to_tick   = document.getElementById("to_tick");

    sources_elems = {};
    for (let s of sources) {
        sources_elems[s] = document.getElementById(s + "_tick");;
    }

    if (old_from) {
        from.value = old_from;
        to.value = old_to;
        search.value = old_search;
    }

    on_enter(search, go);

}

async function main_page() {
    main_div.innerHTML = MAIN_HTML;

    let t = title();
    document.title = t;
    document.getElementById("title").innerHTML =
        t.replace(/\n/g, "<br>");
    document.getElementById("stats").innerHTML =
        stats().replace(/\n/g, "<br>");

    msgs         = document.getElementById("msgs");
    go           = document.getElementById("go");
    top_table    = document.getElementById("top_table");
    search_table = document.getElementById("search_table");

    build_search_table(false);

    reset();
    add_chats(chats);

    go.onclick = go_run;
    document.getElementById("reset").onclick = () => {
        reset();
        add_chats(chats);
    };
}

async function main() {
    window.onbeforeunload = () => "Are you sure you want to exit?";
    main_div.innerHTML = PASS_HTML;
    let pass = document.getElementById("pass");
    let pass_go = document.getElementById("passgo");
    let info = document.getElementById("info");
    let err = e => info.innerHTML =
        '<font color="red">Wrong password. Try again</font>';
    pass_go.onclick = async () => {
        let key = pass.value;
        if (key && key.length != 0) {
            try {
                info.innerHTML = "Loading...";
                await sleep(200);
                let dec = JSON.parse(compress.d(enc_data, key));
                names = dec.names;
                sources = dec.sources;
                chats = dec.chats;
                main_page();
            } catch (e) {
                err(e);
            }
        } else {
            err();
        }
    };
    on_enter(pass, pass_go);
    pass.focus();
}

main();
