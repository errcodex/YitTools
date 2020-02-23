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
        remote.dialog.showErrorBox('错误', user.text);
        gridOptions.api.setRowData([])
        return;
    }
    gridOptions.api.setRowData(ipcRenderer.sendSync("getScore"))


    var app = new Vue({
        el: '#app',
        data: {
            uid: '',
            name: '',
            gpa: 0,
            checked: false //计算<=1的成绩
        },
        watch: {
            checked:'countGPA'
        },
        created: () => {},
        methods: {
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
            }
        }
    });
    window.app = app
    app.uid = user.data.uid
    app.name = user.data.username
    app.countGPA(false);
})();