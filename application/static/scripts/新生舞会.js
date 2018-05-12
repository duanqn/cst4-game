// noinspection BadExpressionStatementJS
({
    "type": "main", // main, random
    "name": "新生舞会",
    "stage": "大一",
    "pages": [ // 一个事件由若干页面组成
        {
            "id": "start", // 指定页面的 id 作为其标示，在跳转和条件判断时用到
            // id 为 start 的页面会成为第一个被显示的
            "image": "新生舞会/舞会培训.jpg",
            "text": [ // 每个字符串代表一个自然段
                "某辅导员似乎说过，新生舞会是在大学期间唯一可以牵到女生的手的机会。",
                "马上要到舞会了，你选择："
            ],
            "choices": [
                {
                    "text": "邀请班上的女同学作为舞伴",
                    "actions": [ // 选择选项带来的影响
                        jump("invite") // 跳转到 invite 页面
                    ]
                },
                {
                    "text": "邀请室友作为舞伴",
                    "actions": [
                        jump("roommate")
                    ]
                },
                {
                    "text": "算了，还是呆在寝室里吧",
                    "actions": [
                        jump("otaku")
                    ]
                }
            ]
        },
        {
            "id": "invite",
            "text": [
                "她答应了！你觉得自己在脱单的道路上向前迈出了历史性的第一步。",
                "今晚就是舞会了，你准备如何前往舞会现场？"
            ],
            "choices": [
                {
                    "text": "先去C楼买一枝花，然后带着花到楼下载她一起去",
                    "actions": [
                        increase("#魅力", 2), // # 开头的是全局变量；令数值加 2
                        increase("$魅力", 2), // $ 开头的是局部变量，只在当前事件中有效
                        flag("$送花"),
                        flag("$载人") // flag 将布尔变量值设为 true ，类似还有 unflag
                    ]
                },
                {
                    "text": "送花感觉有点尴尬，就到楼下载她去吧",
                    "actions": [
                        increase("#魅力", 1),
                        increase("$魅力", 1),
                        flag("$载人")
                    ]
                },
                {
                    "text": "自己没学会骑车载人，只能和她一同骑车前往",
                    "actions": [
                        decrease("#魅力", 1),  // 令数值减 1
                        decrease("$魅力", 1)
                    ]
                }
            ],
            "actions": [ // 页面影响会在选项影响之后执行
                jump("dance") // 注意：如果选项中有 jump ，会忽略页面的 jump
            ]
        },
        {
            "id": "roommate",
            "text": [
                "于是你骑车载着室友来到了舞会现场，在一对对西装配长裙的舞伴中，你们只能尴尬对视。",
                "好在现场还有配对的活动，你成功找到了异性舞伴。"
            ],
            "actions": [
                jump("dance")
            ]
        },
        {
            "id": "otaku",
            "text": [
                "于是你在寝室度过了一晚上。",
                "因为辅导员也去舞会了，所以你光明正大地在寝室用起了电脑。",
                "室友回来后，你还对跳舞出糗的他进行了一番嘲笑。"
            ]
            // 如果页面没有执行 jump ，那么事件结束
        },
        {
            "id": "dance",
            "image": "新生舞会/舞会现场.jpg",
            "text": [
                "最简单的交谊舞就是在地上画三角形。",
                "一嗒嗒、二嗒嗒、三嗒嗒。你们在舞池中跳了一支舞，你非常紧张，生怕踩到她的脚，一直低头注意着自己的步伐。",
                "曲终，你成功避开了她的脚。你对自己感到非常满意，但她似乎不是很开心的样子。下一支曲子就要开始了，于是你："
            ],
            "choices": [
                {
                    "text": "觉得她累了，提议休息一会"
                },
                {
                    "text": "继续跳舞，还是得注意不能踩着她",
                    "actions": [
                        increase("#魅力", -1), // 和 decrease(x, 1) 是相同的
                        increase("$魅力", -1)
                    ]
                },
                {
                    "text": "继续跳舞，动作幅度小一些，不再只关注自己脚下",
                    "actions": [
                        increase("#魅力", 2),
                        increase("$魅力", 2),
                    ],
                    "condition": ge("$魅力", 1) // 需要满足条件才可以选择这一选项
                    /* 条件：
                       ge: >=
                       gt: >
                       le: <=
                       lt: <
                       eq: ==
                       ne: !=
                     */
                }
            ],
            "actions": [
                jump("final")
            ]
        },
        {
            "id": "final",
            "image": "新生舞会/月亮.jpg",
            "text": [
                "舞会结束了，你们走出了会场。夜空中没有云，今晚的月亮正圆。",
                "你送她回到了楼下，然后相互告别。",
                ge("$魅力", 3).then([ // 在满足条件时才会出现这一段文本
                    "就在你准备离开前，她喊住了你。",
                    "{#姓名}，我今晚过得很开心，谢谢你。”她笑着对你说，然后转身向门口走去。",
                    "她的裙摆被风微微吹动，在你的心里泛起涟漪"
                ]),
                ge("$魅力", 1).and(lt("$魅力", 3)).then([
                    flagged("$送花").then([
                        "她笑着谢谢你为她带的花，之后转身向门口走去。"
                    ]).else(flagged("$载人").then([
                        "她笑着谢谢你载她回来，之后转身向门口走去。"
                    ]))
                ]) // 条件可以嵌套
            ],
            "actions": [
                ge("$魅力", 3).then(achieve("裙摆飘飘")) // 满足条件则解锁成就
            ]
        }
    ]
})
