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
                    "message": "同意本程序以你的名义访问教务系统。"
                })
            }
        }
    });




})();