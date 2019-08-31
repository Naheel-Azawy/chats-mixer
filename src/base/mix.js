const fs  = require('fs');
const xml = require('xml2json');
const print = s => console.log(s);

// [ { app, time, sender, text }, ... ]

function mix(data_dir) {
    let names = JSON.parse(fs.readFileSync(data_dir + "/names.json"));
    let final = [];
    let sources = [];

    function get_name(name) {
        for (let n of Object.values(names.to)) {
            if (name === n) {
                return names.to.real;
            }
        }
        for (let n of Object.values(names.from)) {
            if (name === n) {
                return names.from.real;
            }
        }
        return "???";
    }

    function insta() {
        let j;
        try {
            j = JSON.parse(fs.readFileSync(data_dir + "/insta/messages.json"));
        } catch (e) {
            return;
        }
        for (let i in j) {
            if (j[i].participants[0] === names.to.instagram) {
                for (let c of j[i].conversation) {
                    final.push({
                        app: "Instagram",
                        time: new Date(c.created_at).getTime(),
                        sender: get_name(c.sender),
                        text: c.text
                    });
                }
            }
        }
        sources.push(final[final.length - 1].app);
    }

    function face() {
        let j;
        try {
            j = JSON.parse(fs.readFileSync(data_dir + "/face/message_1.json")).messages;
        } catch (e) {
            return;
        }
        for (let m of j) {
            final.push({
                app: "Facebook",
                time: m.timestamp_ms,
                sender: get_name(m.sender_name),
                text: m.content
            });
        }
        sources.push(final[final.length - 1].app);
    }

    function whatsapp() {
        let t;
        try {
            t = fs.readFileSync(data_dir + "/whatsapp/chat.txt").toString().split("\n");
        } catch (e) {
            return;
        }
        let l;
        // skip first message
        for (let i = 1; i < t.length; ++i) {
            l = t[i];
            // if multi-line text
            if (!l.match(/^\d\d?\/\d\d?\/\d\d?, /g)) {
                final[final.length - 1].text += '\n' + l;
                continue;
            }
            let ll = l;
            l = l.split(" - ");
            l[1] = l[1].split(": ");
            final.push({
                app: "WhatsApp",
                time: new Date(l[0]).getTime(),
                sender: get_name(l[1][0]),
                text: l[1][1] === "<Media omitted>" ? undefined : l[1][1]
            });
        }
        sources.push(final[final.length - 1].app);
    }

    function telegram() {
        let j;
        try {
            j = JSON.parse(fs.readFileSync(data_dir + "/telegram/result.json")).chats.list;
        } catch (e) {
            return;
        }
        for (let c of j) {
            if (c.name && c.name === names.to.telegram) {
                j = c.messages;
                break;
            }
        }
        for (let m of j) {
            final.push({
                app: "Telegram",
                time: new Date(m.date).getTime(),
                sender: m.from ? get_name(m.from) : get_name(m.actor),
                text: (!m.text || m.text === "") ? m.sticker_emoji : m.text
            });
        }
        sources.push(final[final.length - 1].app);
    }

    function sms() {
        let j;
        try {
            j = JSON.parse(xml.toJson(fs.readFileSync(data_dir + "/sms/sms.xml"))).allsms.sms;
        } catch (e) {
            return;
        }
        for (let m of j) {
            final.push({
                app: "SMS",
                time: Number(m.date),
                sender: get_name(m.address),
                text: m.body
            });
        }
        sources.push(final[final.length - 1].app);
    }

    function mkjson() {
        insta();
        face();
        whatsapp();
        telegram();
        sms();
        final.sort((a, b) => a.time - b.time);
        //final = final.slice(0, 10);
        return {
            names: {
                to:   { real: names.to.real   },
                from: { real: names.from.real },
                title_extra: names.title_extra
            },
            sources: sources,
            chats: final
        };
    }

    return mkjson();
}

module.exports = mix;
