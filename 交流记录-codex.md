


================
04.18
请参考下面用户发现的新问题或者提的建议，分析解决方案
KPWritingAssistant-web\docs\sugession&issues\KP作文宝-功能意见-0414.html
========


还发现一个问题，生产范文的时候，总是提示“生成的范文未满足字数约束，请稍后重试”，你先分析一下问题原因，然后告诉我当前生产范文的逻辑和对应的提示词，当前调用的哪个大模型来生成的范文？

我理解正常给大模型一个明确的提示词，生成一个满足字数要求的作文输出，一般大模型是可以一次性搞定的，为何你还需要对生产的范文结果字数进行专门的校验？
所以我很怀疑你给的提示词不明确，或者是调用的大模型能力太差？所以需要你先将提示词发出来确认一下是否有问题，如果提示词没问题，那么我可以找一个能力更强大的大模型来给你调用

===========

客户根据最新的生产环境能力提了一些新的意见，请先逐个问题分析根因，然后给出详细的解决方案
KPWritingAssistant-web\docs\sugession&issues\功能意见-0412.html
上面的规划结果和实现方案拆解成可独立执行的待办任务添加到待办任务列表中，然后开始逐个问题进行处理

==============
我放了两张手写作文图片到本地，同时有对应的作文预期识别结果文档，现在需要你将这两张手写作文图片作为测试集，来验证一下OCR接口的识别准确率
你将当前已经支持的3中OCR接口分别调用一下这个接口，然后分别对这个识别结果和预期的结果进行对比，然后给出一个详细的OCR识别准确性评估
将这个对比流程写成一个固定的测试用例，默认可以不执行这个用例，但是如果需要部署到生产服务器环境之前，需要先跑一下这个测试用例来评估一下当前的OCR准确性，并判断当前的OCR准确性是否与上个版本存在劣化？如果劣化超过一个阈值（准确度低于90%，或者比上次准确度降低超过5%）时需要提醒我来判断是否需要进一步处理

KPWritingAssistant-web\e2e\fixtures\ket作文手写样例.jpg
KPWritingAssistant-web\e2e\fixtures\ket作文手写样例预期识别结果.txt
KPWritingAssistant-web\e2e\fixtures\pet作文手写样例.jpg
KPWritingAssistant-web\e2e\fixtures\pet作文手写样例预期识别结果.txt

===================

KPWritingAssistant-web\docs\sugession&issues\好未来API调用文档-HTTP-HTTPS鉴权.mhtml
KPWritingAssistant-web\docs\sugession&issues\好未来API调用文档-WS-WSS鉴权.mhtml

当前项目的OCR图片识别效果不太行，需要改成好未来的OCR识别接口，我已经准备好对应的key了，
你将当前代码扩展一下，现有能力不变的情况下，新增支持切换成好未来的OCR识别接口
具体的好未来OCR接口使用相关文档参考如下，之前已经使用claudeCode开发过一些代码，但是代码开发完成后无法调通接口，你先评估一下现状，然后详细分析一下如何解决
KPWritingAssistant-web\docs\sugession&issues\好未来API调用文档.mhtml
KPWritingAssistant-web\docs\sugession&issues\好未来通用OCR接口文档.mhtml
KPWritingAssistant-web\docs\sugession&issues\好未来API调用文档-HTTP-HTTPS鉴权.mhtml
KPWritingAssistant-web\docs\sugession&issues\好未来API调用文档-WS-WSS鉴权.mhtml
