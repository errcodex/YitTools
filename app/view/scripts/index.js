(function () {

    const {
        ipcRenderer,
        remote
    } = require('electron')

    var app = new Vue({
        el: '#app',
        data: {
            uid: '',
            pwd: '',
            checked:false
        },
        methods: {
            login: function () {
                if (this.uid == "" || this.pwd == "") {
                    remote.dialog.showErrorBox('无法登陆', '用户名、密码不能为空');
                    return;
                }
                if(!this.checked){
                    remote.dialog.showErrorBox('无法登陆', '请先同意用户协议');
                    return;
                }

                let msg = ipcRenderer.sendSync("checkUser", this.uid, this.pwd);

                if (msg.status != "ok") {
                    remote.dialog.showErrorBox('无法登陆', '用户名、密码不正确');
                    return;
                }
                location.href = "gpa.html"
            },
            showAgreement:()=>{
                remote.dialog.showMessageBox(null, {
                    "type": "info",
                    "buttons": [],
                    "title": "用户协议",
                    "message": "1. 燕理工具箱（以下简称本程序）是一款非官方发布的开源软件，用户（以下"+
					"简称您）可以在非盈利的情况下自由复制、传播、使用，本程序的所有功能完全在您本地实"+
					"现，不收集您的任何信息，包括但不限于账号密码和教务信息等。\n"+
					"2. 本程序涉及教务的事宜均遵循您的操作，您的所有操作指令都将通过界面实时反馈给您，"+
					"本程序无任何后台操作。所有通过本程序发出的，包括但不限于数据查询、数据修改都"+
					"认为是您进行的操作，您应当对该操作负有主体责任，任何人使用本人或他人身份信息查询或修改数据"+
					"的，应当承担该操作的全部责任，本程序不承担任何责任。\n"+
					"3. 您应当认真充分地阅读本用户协议，如有异议应当立即停止使用，如您继续使用本程序"+
					"即默认本用户协议的所有条款。"
                })
            }
        }
    });




})();