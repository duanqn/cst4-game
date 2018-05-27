'use strict';

let App = angular.module('myApp', [
    'ngMaterial'
]).config(['$locationProvider', '$mdThemingProvider',
    function ($locationProvider, $mdThemingProvider) {
        $locationProvider.hashPrefix('!');
        $mdThemingProvider.theme('default').primaryPalette('purple');
        $mdThemingProvider.enableBrowserColor();
    }
]).filter('character', function () {
    return function (input) {
        return String.fromCharCode(64 + parseInt(input, 10));
    };
}).filter('variableRemoveScope', function () {
    return function (input) {
        if (input[0] === '#' || input[0] === '$') return input.substr(1);
        return input;
    };
});

function cheat() {
    let initActions = [
        set("#体力", 100),
        set("#魅力", 100),
        set("#成绩", 100),
        set("#社工", 100),
        set("#性别", "男"),
        set("#姓名", "杨天龙")
    ];
    for (let action of initActions)
        valueOf(action);
}

App.controller('AppCtrl', ['$scope', '$http', '$mdToast', '$mdMenu', function ($scope, $http, $mdToast, $mdMenu) {
    let defaultEvent = {
        type: "main",
        name: "天下大计",
        stage: "计四年级毕业联欢",
        pages: [
            // {
            //     id: "start",
            //     image: "logo.jpeg",
            //     choices: [
            //         {
            //             text: "开始游戏",
            //         },
            //         {
            //             text: "载入游戏",
            //         },
            //         {
            //             text: "成就列表",
            //         }
            //     ],
            //     actions: [
            //         exec(function () {
            //             loadScriptFromUrl('/static/scripts/merged_script.js');
            //         }),
            //         achieve("开始游戏")
            //     ]
            // },
            {
                id: "deadline",
                deadline: {
                    targets: [3, 6, 9],
                    title: "造计算机",
                    time: 1000,
                    moving: true,
                    badChoices: 3
                },
                actions: [
                    exec(function () {
                        loadScriptFromUrl('/static/scripts/merged_script.js');
                    })
                ]
            }
        ],
    };

    $scope.current = {
        event: defaultEvent,
        page: defaultEvent.pages[0],
        choices: [],
        progress: 0,
        text: null,
        input: "",
        eventIndex: -1,
        ending: false
    };
    $scope.deadline = {
        progress: 0,
        clicks: 0,
        maxClicks: 0,
        timeRemaining: 0,
        targets: [],
        targetsPercentage: [],
        grade: 0,
        gradesList: [],
        timer: -1,
        movingTimer: -1,
        badChoicesText: []
    };
    $scope.events = [];

    let inTransition = false;

    let pageMap = {};

    function initialize() {
        global.clear();
        local.clear();
        $scope.current.ending = false;
        let initActions = [
            set("#脱单", false),
            set("#体力", 0),
            set("#魅力", 0),
            set("#成绩", 0),
            set("#直博", false),
            set("#社工", 0)
        ];
        for (let action of initActions)
            valueOf(action);
    }

    initialize();

    let imageCache = [];

    function loadScript(js) {
        let jsValue = eval(js);
        if (!(jsValue instanceof Array))
            jsValue = [jsValue];
        $scope.events = jsValue;
        initialize();
        // cheat();

        // load images
        imageCache = [];
        for (let event of $scope.events)
            for (let page of event.pages)
                if (page.image !== undefined) {
                    let img = new Image();
                    img.src = '/static/image/' + page.image;
                    imageCache.push(img);
                }

        loadEvent(0);
    }

    function loadScriptFromUrl(url) {
        $http.get(url).then(function (response) {
            let currentScript = response.data;
            loadScript(currentScript);
        });
    }

    function recursiveAddText(currentText, textArray) {
        if (!textArray) return;
        if (typeof textArray === "string") {
            currentText.push(replaceVariables(textArray));
            return;
        }
        for (let text of textArray) {
            if (typeof text === "string") {
                currentText.push(replaceVariables(text));
            } else {
                recursiveAddText(currentText, text.value());
            }
        }
    }

    function initDeadline(ddlConfig) {
        $scope.deadline = {
            progress: 0,
            clicks: 0,
            targets: ddlConfig.targets.slice().sort(),
            timeRemaining: ddlConfig.time,
            grade: 0
        };
        $scope.deadline.maxClicks = $scope.deadline.targets[$scope.deadline.targets.length - 1];
        $scope.deadline.targetsPercentage =
            $scope.deadline.targets.map(x => 100 * x / $scope.deadline.maxClicks).reverse();

        if ($scope.deadline.targets.length === 1) {
            $scope.deadline.gradesList = ["失败", "通过！"];
        } else if ($scope.deadline.targets.length === 2) {
            $scope.deadline.gradesList = ["失败", "及格", "优秀！"];
        } else if ($scope.deadline.targets.length === 3) {
            $scope.deadline.gradesList = ["失败", "及格", "良好", "优秀！"];
        }

        $scope.deadline.badChoicesText = ["开小差", "打盹", "放弃治疗"].slice(0, ddlConfig.badChoices | 0);
        if (ddlConfig.moving) {
            setTimeout(function () {
                let $board = document.querySelector(".deadline-board");
                let $buttons = Array.prototype.slice.call(document.querySelectorAll(".deadline-board .md-button"));
                let ratio = $board.offsetWidth / $board.offsetHeight;
                let $left = $buttons.map(x => $board.offsetLeft - x.offsetLeft);
                let $width = $buttons.map(x => $board.offsetWidth - x.offsetWidth);
                let $top = $buttons.map(x => $board.offsetTop - x.offsetTop);
                let $height = $buttons.map(x => $board.offsetHeight - x.offsetHeight);

                let deltaX = [], deltaY = [];
                let speed = 0.5; // 30% in a second
                for (let i in $buttons) {
                    let theta = (Math.random() - 0.5) * Math.PI;
                    let x = Math.cos(theta), y = Math.sin(theta);
                    x *= speed;
                    y *= speed;
                    deltaX.push(x);
                    deltaY.push(y);
                }

                let posX = [], posY = [];
                for (let i in $buttons) {
                    posX.push(-$left[i] / $width[i]);
                    posY.push(-$top[i] / ratio / $height[i]);
                }

                function rectify(x) {
                    let val = x % 2.0;
                    if (val < 0) val += 2.0;
                    if (val > 1.0) return 2.0 - val;
                    else return val;
                }

                let fps = 60;
                $scope.deadline.movingTimer = setInterval(function () {
                    for (let i in $buttons) {
                        let value = $buttons[i];
                        posX[i] += deltaX[i] / fps;
                        posY[i] += deltaY[i] / fps;
                        value.style.left = ($left[i] + rectify(posX[i]) * $width[i]) + "px";
                        value.style.top = ($top[i] + rectify(posY[i] * ratio) * $height[i]) + "px";
                    }
                }, 1000 / fps);
            }, 400);
        }

        // Start countdown timer
        let startTime = Date.now();
        let totalTime = ddlConfig.time;
        $scope.deadline.timer = setInterval(function () {
            let remaining = totalTime - (((Date.now() - startTime) / 1000) | 0);
            if (remaining <= 0) {
                finishDeadline();
            } else {
                $scope.$apply(function () {
                    $scope.deadline.timeRemaining = remaining;
                });
            }
        }, 1000);
    }

    function shrinkElement(element, height, callback, duration = 400) {
        let sectionHeight = element.offsetHeight;
        let tempTransition = element.style.transition;
        element.style.transition = "";
        inTransition = true;

        requestAnimationFrame(function () {
            element.style.height = sectionHeight + "px";
            element.style.transition = tempTransition + " height " + duration + "ms";

            requestAnimationFrame(function () {
                // console.log("shrink: " + sectionHeight + " to " + height);
                let eventListener = function (e) {
                    inTransition = false;

                    element.removeEventListener('transitionend', eventListener);
                    element.style.transition = tempTransition;
                    if (callback !== undefined && callback !== null) callback();
                };
                element.addEventListener('transitionend', eventListener);

                element.style.height = height + "px";
            });
        });
    }

    function expandElement(element, callback, duration = 400) {
        let tempHeight = element.style.height;
        let tempTransition = element.style.transition;
        element.style.transition = "";
        element.style.height = null;
        inTransition = true;

        requestAnimationFrame(function () {
            let targetHeight = element.offsetHeight;
            element.style.height = tempHeight;
            element.style.transition = tempTransition + " height " + duration + "ms";

            requestAnimationFrame(function () {
                // console.log("expand: " + tempHeight + " to " + targetHeight);
                let eventListener = function (e) {
                    inTransition = false;

                    element.removeEventListener('transitionend', eventListener);
                    element.style.height = null;
                    element.style.transition = tempTransition;
                    if (callback !== undefined && callback !== null) callback();
                };
                element.addEventListener('transitionend', eventListener);

                element.style.height = targetHeight + "px";
            });
        });
    }

    function changeCardContent(callback, height) {
        let $card = document.querySelector("md-card");
        let $cardHeader = document.querySelector("md-card-header");

        let headerHeight = $cardHeader.scrollHeight;
        $cardHeader.style.minHeight = headerHeight + "px";
        if (height === undefined) height = headerHeight;
        shrinkElement($card, height, function () {
            $scope.$apply(callback);

            expandElement($card, function () {
                $cardHeader.style.minHeight = null;
            });
        });
    }

    function loadPage(label, animate = true) {
        let loadPageImpl = function () {
            if (!(label in pageMap)) {
                throw '跳转的页面标识"' + label + '"未定义';
            }
            $scope.current.page = pageMap[label];

            if ($scope.current.page.actionsBefore)
                runActions($scope.current.page.actionsBefore, false);

            if ($scope.current.page.deadline !== undefined) {
                let ddlConfig = $scope.current.page.deadline;
                initDeadline(ddlConfig);
            } else {
                let text = [];
                recursiveAddText(text, $scope.current.page.text);
                $scope.current.text = text;

                let choices = [];
                if ($scope.current.page.choices && $scope.current.page.choices.length > 0) {
                    for (let choice of $scope.current.page.choices) {
                        let displayChoice = Object.assign({}, choice);
                        displayChoice.text = valueOf(choice.text);
                        choices.push(displayChoice);
                    }
                }
                $scope.current.choices = choices;
            }
        };

        if (animate) {
            changeCardContent(loadPageImpl);
        } else {
            loadPageImpl();
        }
    }

    function loadEvent(idx, animate = true) {
        let loadEventImpl = function () {
            $scope.current.eventIndex = idx;
            $scope.current.progress = 100 * idx / $scope.events.length;
            $scope.current.event = $scope.events[idx];
            console.log($scope.current.event.name);
            pageMap = {};
            for (let page of $scope.current.event.pages) {
                if (page.id in pageMap) {
                    throw '重复的页面标识"' + page.id + '"';
                }
                pageMap[page.id] = page;
            }

            loadPage('start', false);
        };

        if (animate) {
            changeCardContent(loadEventImpl, 0);
        } else {
            loadEventImpl();
        }
    }

    let endingsList = [];
    let endingMap = {};

    $http.get('/static/scripts/ending.js').then(function (response) {
        let currentScript = response.data;
        endingsList = eval(currentScript);

        for (let ending of endingsList)
            endingMap[ending.name] = ending;
    });

    function loadEnding(name, animate = true) {
        let ending = null;
        if (name !== undefined) {
            ending = endingMap[name];
        } else {
            ending = {
                name: "正常结局",
                text: [
                    "我们应该在这里汇总一下玩家的信息。",
                    "比如可以有：",
                    Object.keys(global.values).map(x => x + "：{#" + x + "}").join("，") + "。",
                    "注意，输出前要确保变量存在，所以最好找个地方做全局的初始化。",
                    "目前结局之后只能刷新页面重来，之后大概会改。"
                ]
            };
        }

        let loadEndingImpl = function () {
            $scope.current.event = {
                name: ending.name,
                stage: "结局"
            };
            $scope.current.page = {
                image: ending.image,
            };
            $scope.current.choices = [];
            $scope.current.text = [];
            recursiveAddText($scope.current.text, ending.text);
            $scope.current.ending = true;
        };
        changeCardContent(loadEndingImpl, 0);
    }

    function nextEvent() {
        local.clear();
        let nextIndex = $scope.current.eventIndex + 1;
        while (nextIndex < $scope.events.length) {
            if ($scope.events[nextIndex].condition && valueOf($scope.events[nextIndex].condition) === false) {
                ++nextIndex;
            } else {
                loadEvent(nextIndex);
                return;
            }
        }
        loadEnding();
    }

    let toast = [];

    function showToast(msg) {
        console.log("Toast:", msg);
        toast.push(msg);
        if (toast.length === 1) {
            let curToast = null;
            let nextToast = function () {
                if (curToast !== null) {
                    toast = toast.slice(1);
                    // $mdToast.hide(curToast);
                }
                if (toast.length > 0) {
                    let msg = toast[0];
                    console.log("$mdToast:", msg);
                    curToast = $mdToast.show($mdToast.simple().textContent(msg));
                    setTimeout(nextToast, 3000);
                }
            };
            nextToast();
        }
    }

    function runActions(actions, nextEventIfNoJump = true) {
        let jumpTarget = null;
        let endingName = null;
        let toastContent = null;
        let exec = [];

        for (let action of actions) {
            if (action instanceof Exec) {
                exec.push(action);
                continue;
            }
            let val = action.value();
            // console.log(action.constructor.name, '=>', val);
            if (val instanceof Jump) {
                jumpTarget = val.label;
            } else if (val instanceof Log) {
                showToast(val.msg);
                // toastContent = val.msg;
            } else if (val instanceof Ending) {
                endingName = val.name;
            }
        }

        if (endingName !== null) {
            loadEnding(endingName);
        } else if (exec.length !== 0) {
            for (let action of exec)
                action.value();
        } else {
            if (jumpTarget !== null) {
                loadPage(jumpTarget);
            } else if (nextEventIfNoJump) {
                console.log("End event");
                nextEvent();
            }
        }
    }

    $scope.choose = function (index) {
        if (inTransition) return;

        let actions = [];
        if ($scope.current.page.actions)
            actions.push(...$scope.current.page.actions);
        if (index === -1) {
            console.log("Choose continue");
        } else {
            let choice = $scope.current.page.choices[index];
            console.log("Choose " + index + ": " + choice.text);
            if (choice.actions)
                actions.push(...choice.actions);
        }

        if ($scope.current.page.input) {
            console.log("Input " + $scope.current.page.input + ": " + $scope.current.input);
            set($scope.current.page.input, $scope.current.input).value()
        }

        runActions(actions);
    };

    function finishDeadline() {
        clearTimeout($scope.deadline.timer);
        clearInterval($scope.deadline.movingTimer);
        console.log("QTE: " + $scope.deadline.gradesList[$scope.deadline.grade]);

        let actions = [set("$__QTE__", $scope.deadline.grade)];
        if ($scope.current.page.actions)
            actions.push(...$scope.current.page.actions);

        runActions(actions);
    }

    if ($scope.current.page.deadline) {
        initDeadline($scope.current.page.deadline);
    }

    $scope.deadlineClick = function (delta) {
        $scope.deadline.clicks = Math.max(0, $scope.deadline.clicks + delta);
        let clicks = $scope.deadline.clicks;
        $scope.deadline.progress = 100 * clicks / $scope.deadline.maxClicks;
        let grade = 0;
        for (let i = $scope.deadline.targets.length - 1; i >= 0; --i)
            if (clicks >= $scope.deadline.targets[i]) {
                grade = i + 1;
                break;
            }
        $scope.deadline.grade = grade;
    };

    if (window.innerWidth >= 960) {
        $mdToast.show($mdToast.simple()
            .textContent("推荐在手机上使用Chrome浏览器进行游戏。" +
                "当然，也可以使用桌面版Chrome浏览器，进入审查元素并选择移动端视图。")
            .position("top left").hideDelay(5000));
    }

    $scope.loadLocalScript = function () {
        let f = document.createElement("input");
        f.style.display = "none";
        f.type = "file";
        f.name = "file";
        let eventListener = function () {
            console.log(f.files[0].name);
            let reader = new FileReader();
            reader.onload = function (ev) {
                console.log("Load complete");
                loadScript(ev.target.result);
            };
            reader.readAsText(f.files[0]);
            f.removeEventListener('change', eventListener);
        };
        f.addEventListener('change', eventListener);
        f.click();
    };
}]);
