'use strict';
const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    shell,
    dialog
} = require("electron")

const superagent = require('superagent');
require('superagent-charset')(superagent)
const fs = require("fs")
const cheerio = require('cheerio')

let win;
const menu = Menu.buildFromTemplate([{
    label: '文件',
    submenu: [{
        label: '返回首页',
		click: function () {
            win.loadFile(__dirname + '/view/index.html')
        }
    }, {
        type: 'separator'
    }, {
        label: '退出',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit'
    }]
}, {
    label: '帮助',
    role: 'help',
    submenu: [{
        label: '反馈',
        click: function () {
            shell.openExternal("https://github.com/errcodex/YitTools/issues");
        }
    }, {
        label: '源代码 / 为项目做出贡献',
        click: function () {
            shell.openExternal("https://github.com/errcodex/YitTools");
        }
    }, {
        label: '关于',
        click: function () {
            dialog.showMessageBox(null, {
                "type": "info",
                "buttons": [],
                "title": "关于",
                "message": "燕理工具箱 v" + app.getVersion()
            })
        }
    }]
}])

function createWindow() {
    win = new BrowserWindow({
        width: 650,
        height: 500,
        webPreferences: {
            nodeIntegration: true
        },
        resizable:false
    })
    win.loadFile(__dirname + '/view/index.html')
    
    if(!app.isPackaged){//开发环境
        win.webContents.openDevTools()//开发者工具
        win.setResizable(true)
    }

    Menu.setApplicationMenu(menu)

    let gpa = new GPA()

    ipcMain.on("checkUser", (e, uid, pwd) => {
        gpa.setUser(uid, pwd)
        gpa.checkUser().then((v) => {
            e.returnValue = v
        })
    })

    ipcMain.on("getUser", (e) => {
        let user = gpa.getUser()
        if (!user) {
            e.returnValue = {
                "status": "err",
                "text": "请先登录"
            }
        }
        e.returnValue = {
            "status": "ok",
            "data": gpa.getUser()
        }
    })

    ipcMain.on("getScore", (e) => {
        gpa.getScore().then((v) => {
            e.returnValue = v;
        })

    })
}
app.on('ready', createWindow)





class GPA {

    constructor() {
        this.checked = false;
        this.http = new Http();
        this.uid = ''
        this.pwd = ''
        this.username = ''
    }
    setUser(uid, pwd) {
        this.uid = uid;
        this.pwd = pwd;
        this.checked = false;
    }
    getUser() {
        if (!this.checked) {
            return false
        }
        return {
            "uid": this.uid,
            "username": this.username
        }
    }
    checkUser() {
        return new Promise((resolve, reject) => {
            //用户登录
            this.http.post("http://49.233.125.101:81/yjlgxy_jsxsd/xk/LoginToXk", {
                encoded: this.encode(this.uid) + "%%%" + this.encode(this.pwd)
            }).then((v) => {
                if (v.indexOf("用户名或密码错误") != -1) {
                    resolve({
                        "status": "err",
                        text: "用户名或密码错误"
                    })
                    return;
                }

                //获取用户信息
                this.http.get("http://49.233.125.101:81/yjlgxy_jsxsd/framework/xsMain.jsp").then((v) => {
                    let username = cheerio.load(v)('#Top1_divLoginName').text().split("(")[0].trim()
                    if (username != "") {
                        this.username = username
                        this.checked = true
                        resolve({
                            "status": "ok"
                        })
                        return
                    }
                    resolve({
                        "status": "err",
                        text: "出错"
                    })
                })

            })
        })

    }
    getScore() {
        return new Promise((resolve, reject) => {
            let score = [];
            //let $ = cheerio.load(fs.readFileSync("tmp.html"))
            this.http.post("http://49.233.125.101:81/yjlgxy_jsxsd/kscj/cjcx_list", {
                "kksj": "",
                "kcxz": "",
                "kcmc": "",
                "xsfs": "max"
            }).then((v) => {
                if (v.indexOf("查询条件：全部") == -1) {
                    reject("无法获取成绩信息");
                    return
                }
                let $ = cheerio.load(v)
                let tr = $("tr").toArray()
                for (let i = 1; i < tr.length; i++) {
                    let td = $(tr[i]).find("td").toArray();
                    let arr = {};
                    arr.name = $(td[3]).text().trim()
                    arr.score = $(td[4]).text().trim()
                    arr.grade = parseFloat($(td[5]).text().trim())
                    arr.attribute = $(td[9]).text().trim()
                    arr.gp = this.countGP(arr.score)
                    score.push(arr)
                }
                resolve(score)
            })
        })
    }
    countGP(score) {
        let point = parseInt(score)
        if (!isNaN(point)) { //分数制
            if (point >= 95)
                return 4.67;
            else if (point >= 90)
                return 4.33;
            else if (point >= 87)
                return 4.00;
            else if (point >= 84)
                return 3.67;
            else if (point >= 80)
                return 3.33;
            else if (point >= 77)
                return 3.00;
            else if (point >= 74)
                return 2.67;
            else if (point >= 70)
                return 2.33;
            else if (point >= 67)
                return 2.00;
            else if (point >= 64)
                return 1.67;
            else if (point >= 61)
                return 1.33;
            else if (point >= 60)
                return 1.00;
            else
                return 0.00;

        } else {
            if (score == "优")
                return 4.33;
            else if (score == "良")
                return 3.33;
            else if (score == "中")
                return 2.33;
            else if (score == "及格" || score == "合格")
                return 1.00;
            else
                return 0.00;
        }
    }
    //教务系统密码加密算法
    encode(input) {
        const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        let output = "";
        let chr1, chr2, chr3 = "";
        let enc1, enc2, enc3, enc4 = "";
        let i = 0;
        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64
            } else if (isNaN(chr3)) {
                enc4 = 64
            }
            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = ""
        } while (i < input.length)
        return output;
    }

}
class Http {
    constructor() {
        this.agent = superagent.agent()
        this.userAgent = {
            "User-Agent": "Mozilla/5.0 (compatible; YitToolsSpider/1.0; +http://github.com/errcodex/YitTools)"
        }
        this.contentType = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
    }
    get(url, para = {}) {
        return new Promise((resolve, reject) => {
            this.agent
                .get(url)
                .set(this.userAgent)
                .buffer(true)
                .send(para)
                .charset()
                .end((err, res) => {
                    //写入缓存文件
					if(!app.isPackaged){//开发环境
						fs.writeFile("post"+(new Date).getTime()+'.html', res.text, (err) => {
							console.log('get save file err: ',err)
						})
					}
                    resolve(res.text)
                })
        });
    }
    post(url, para) {
        return new Promise((resolve, reject) => {
            this.agent
                .post(url)
                .set(this.userAgent)
                .set(this.contentType)
                .buffer(true)
                .send(para)
                .charset()
                .end((err, res) => {
                    //写入缓存文件
					if(!app.isPackaged){//开发环境
						fs.writeFile("post"+(new Date).getTime()+'.html', res.text, (err) => {
							console.log('post save file err: ',err)
						})
					}
                    resolve(res.text)
                })
        });
    }
}