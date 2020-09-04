(function () {
    const {
        ipcRenderer,
        remote
    } = require('electron')

    //表格选项及实例化
    gridOptions = {
        columnDefs: [{
                headerName: "课程名",
                field: "name",
                width: 220
            },
            {
                headerName: "课程属性",
                field: "attribute",
                width: 90,
                headerClassd: ["text-center"],
                cellClass: ["text-center"]
            },
            {
                headerName: "成绩",
                field: "score",
                width: 90,
                cellClass: ["text-center"]
            },
            {
                headerName: "学分",
                valueGetter: function (params) {
                    return parseFloat(params.data.grade).toFixed(2)
                },
                width: 90,
                cellClass: ["text-center"]
            },
            {
                headerName: "绩点",
                valueGetter: function (params) {
                    return parseFloat(params.data.gp).toFixed(2)
                },
                width: 90,
                cellClass: ["text-center"]
            }
        ],
        getRowClass: (para) => {
            if (para.data.gp < 1) {
                return "colorF"
            } else if (para.data.gp < 2) {
                return "colorE"
            } else if (para.data.gp < 3) {
                return "colorD"
            } else if (para.data.gp < 4) {
                return "colorC"
            } else if (para.data.gp < 4.5) {
                return "colorB"
            } else { //满绩点
                return "colorA"
            }
        }
    };
    new agGrid.Grid(document.querySelector('#myGrid'), gridOptions);





    //后台通信
    let user = ipcRenderer.sendSync("getUser")
    if (user.status != 'ok') {
        //remote.dialog.showErrorBox('错误', user.text);
        //gridOptions.api.setRowData([])
        //return;
		remote.dialog.showErrorBox('登录提醒', "检测到您还没有登录，部分功能将不可用");
		user={data:{
            "uid": "未登录",
            "username": "未登录"
        }};
		gridOptions.api.setRowData([])
    }else{
		gridOptions.api.setRowData(ipcRenderer.sendSync("getScore"))
	}

    var app = new Vue({
        el: '#app',
        data: {
            uid: '',
            name: '',
            gpa: 0,
            checked: false, //计算<=1的成绩
            countingcode: "" //计算过程
        },
        watch: {
            checked: 'countGPA'
        },
        created: () => {},
        methods: {//TODO: ？？？？？？？？？？this是全局指针
            countGPA: (checked) => {
                let sumGrade = 0,
                    sumWeightedGP = 0;
                gridOptions.api.forEachNode((node, index) => {
                    if ((!checked) && node.data.grade <= 1) {
                        return;
                    }
                    sumGrade += node.data.grade;
                    sumWeightedGP += node.data.grade * node.data.gp;
                })
                app.gpa = parseFloat(sumWeightedGP / sumGrade).toFixed(2)
            },
            copy: () => { //复制计算过程
                
                let arrGrade = [],
                    arrWeightedGP = [],
                    arrWeightedGPString = []
                gridOptions.api.forEachNode((node, index) => {
                    if ((!app.checked) && node.data.grade <= 1) {
                        return;
                    }
                    arrGrade.push(node.data.grade);
                    arrWeightedGP.push([node.data.grade, node.data.gp]);
                })
                arrWeightedGP.forEach((value, index) => {
                    arrWeightedGPString.push(value.join("*"));
                });

               

                // TODO: this.countingcode 无响应
                document.querySelector("#countingcode").innerHTML = "(" + arrWeightedGPString.join("+") + ")/(" + arrGrade.join("+") + ")"
                let selection = window.getSelection();
                let range = document.createRange();
                range.selectNodeContents(document.querySelector("#countingcode"));
                selection.removeAllRanges();
                selection.addRange(range);

                document.execCommand('copy')
                remote.dialog.showMessageBox(null, {
                    "type": "info",
                    "buttons": [],
                    "title": "复制成功",
                    "message": "复制成功，可粘贴到其它位置进行验算。"
                })
            }
        }
    });
	
	//调试
    window.app = app
    app.uid = user.data.uid
    app.name = user.data.username
    app.countGPA(false);
})();