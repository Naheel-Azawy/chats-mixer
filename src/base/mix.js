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
        let files = [data_dir + "insta/messages.json"];
        let other_path = data_dir + "insta/1/messages.json";
        if (fs.existsSync(other_path)) {
            files.push(other_path);
        }
        for (let f of files) {
            let j;
            try {
                j = JSON.parse(fs.readFileSync(f));
            } catch (e) {
                return;
            }
            for (let i in j) {
                if (j[i].participants[0] === names.to.instagram) {
                    for (let c of j[i].conversation) {
                        let t = c.text;
                        //let media = c.media ||
                        //    c.media_url     ||
                        //    c.media_share_url;
                        //if (media) {
                        //    media = "Media: " + media;
                        //    if (t) {
                        //        t = media + "\n" + t;
                        //    } else {
                        //        t = media;
                        //    }
                        //}
                        final.push({
                            app: "Instagram",
                            time: new Date(c.created_at).getTime(),
                            sender: get_name(c.sender),
                            text: t
                        });
                    }
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
            // if multi-line text ("5/18/19" | "18/05/2019")
            if (!l.match(/^\d\d?\/\d\d?\/\d\d\d?\d?, /g)) {
                final[final.length - 1].text += '\n' + l;
                continue;
            }
            let ll = l;
            l = l.split(" - ");
            l[1] = l[1].split(": ");
            // if dd/mm/yyyy then make it yyyy/mm/dd so that Date understands
            l[0] = l[0].replace(/(\d\d)\/(\d\d)\/(\d\d\d\d)/, "$3/$2/$1");
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
            let t = (!m.text || m.text === "") ? m.sticker_emoji : m.text;
            if (Array.isArray(t)) {
                let tmp = "";
                for (let o of t) {
                    if (o.type == "link") {
                        o.text = `<a href="${o.text}">${o.text}</a>`;
                    }
                    tmp += o.text + "\n";
                }
                tmp = tmp.trim();
                t = tmp;
            }
            final.push({
                app: "Telegram",
                time: new Date(m.date).getTime(),
                sender: m.from ? get_name(m.from) : get_name(m.actor),
                text: t
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
        // because multiple files in insta can have some repeated items
        let a, b;
        for (let i = 1; i < final.length; ) {
            a = final[i - 1]; b = final[i];
            if (a.app == b.app && a.time == b.time &&
                a.sender == b.sender && a.text == b.text) {
                final.splice(i, 1);
            } else {
                i++;
            }
        }
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
