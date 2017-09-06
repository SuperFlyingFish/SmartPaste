$(function(){
	var paste = {
		init: function(){
			var _this = this;
			_this.attachBehaviors();
		},
		attachBehaviors: function(){
			var _this = this;
			//监听输入框的改变,包括粘贴的数据
//	        $('#pasteContent').bind('input propertychange', function () {
//	            $(this).val($(this).val().replace(/[\f\r\t\v]/g, " ").replace(/[ ]{2,}/g, " ").replace(/\n{2,}/g, "\n").replace(/\n /g, "\n").replace(/ \n/g, "\n")) //不允许输入连续的空格、空格跟回车符
//	        })
	        //点击获取粘贴内容并分析
			$('#pasteConfirmBtn').on('click',function(){
				var pasteValue = $('#pasteContent').val();
				//console.log('获取的值：'+pasteValue)
				_this.methods.analysisData(pasteValue);//数据分析
			})
		},
		methods: {
			//数据分析
			analysisData: function(pasteValue){
				var _this = paste;
				var arrNewData = [];//新数组用于存放分析后的数据
				var common = /上海|江苏|安徽|浙江|北京|天津|大连|成人|儿童|老人|领队|导游|夫妻|生效|[，,;；:：。‘’\042\t]/g; //粘贴字符串中常见的错误信息和标点符号
				var arrFilterData = $.trim(pasteValue.replace(common,' ').replace(/[ ]{2,}/g, " ")).split('\n');//去除首尾空格，基本过滤，两个以上的空格替换成一个空格
				console.log('过滤后的数据'+arrFilterData)
				for(var i=0; i<arrFilterData.length; i++){
					var dataRow = arrFilterData[i];
					var temp = {};
					if(dataRow != '' && /\S/.test(dataRow)){
						//获取证件号
						var IDcode = this.getCopyValue("certIDCode", dataRow);  //身份证
						var passport = this.getCopyValue("certPassport", dataRow);  //中国护照
						temp["relationText"] = '其他';
						temp["relation"] = "5";
						//判断是否是身份证并且是有效的身份证，是身份证从身份证信息中心获取性别和生日
						if(IDcode && this.identityCardValidate(IDcode)){
							//身份证号码
							temp["credNo"] = IDcode;
							//证件类型为身份证
            				temp["credTypeText"] = '身份证';
            				temp["credType"] = '1';
							//获取生日
	            			temp["birthday"] = this.getBirthSex(IDcode).birth;
	            			//获取性别
	            			temp["gender"] = this.getBirthSex(IDcode).sex;
						}else if(passport){
							temp["credNo"] = passport;
							//获取生日
	            			temp["birthday"] = this.getCopyValue("birth", dataRow);
	            			//获取性别
	            			temp["gender"] = this.getCopyValue("gender", dataRow);
	            			//获取证件类型
            				temp["credTypeText"] = '护照';
            				temp["credType"] = '2';
						}else{
							temp["credNo"] = this.getCopyValue("certCode", dataRow);
							//获取生日
	            			temp["birthday"] = this.getCopyValue("birth", dataRow);
	            			//获取性别
	            			temp["gender"] = this.getCopyValue("gender", dataRow);
	            			//获取证件类型
            				temp["credTypeText"] = this.getCopyValue("certType", dataRow);
            				switch(temp["credTypeText"]){
            					case "身份证": temp["credType"] = 1; break;
            					case "护照": temp["credType"] = 2; break;
            					case "港澳通行证": temp["credType"] = 3; break;
            					case "台胞证": temp["credType"] = 4; break;
            					case "军官证": temp["credType"] = 5; break;
            					case "其他": temp["credType"] = 99; break;
            					default: temp["credType"] = 99;temp["credTypeText"] = '其他';
            				}
						}
						if(temp["gender"]){
							temp["genderText"] = temp["gender"] == 'M' ? '男':'女';
						}else{
							temp["genderText"] = '';
						}
						//获取中文名字
						var cnName = this.getCopyValue("cnname", dataRow);
						//获取英文名字
            			var enName = this.getCopyValue("enname", dataRow);
            			//巧妙的方法实现两个空判断，都不为空用中文，有一个为空两者相加
            			temp["name"] = cnName != '' && enName != '' ? cnName : cnName + enName;
            			//获取手机号
            			temp["phone"] = this.getCopyValue("phone", dataRow);
            			//把新数组插入新数组中
            			arrNewData.push(temp);
					}
				}
				console.log(JSON.stringify(arrNewData));
				$('#content').html(JSON.stringify(arrNewData))
			},
			//getCopyValue方法
		    //参数1：需要获取的字段名称
		    //参数2：需要分析的字符串
		    getCopyValue: function (name, arr) {
		    	var _this = paste;
		        var value = "";
	            if(_this.getFieldName[name]){
	            	value = _this.getFieldName[name](arr)
	            }
		        return value;
		    },
		    //从身份证获取生日和性别
		    getBirthSex: function (idCardNo) {
				if (!this.identityCardValidate(idCardNo))
			    	return null;
				var tmpStr = '',
					sexStr = '';
			  	idCardNo = $.trim(idCardNo);
			  	if (idCardNo.length == 15) {
			    	tmpStr = idCardNo.substring(6, 12);
			    	tmpStr = "19" + tmpStr;
					tmpStr = tmpStr.substring(0, 4) + "-" + tmpStr.substring(4, 6) + "-" + tmpStr.substring(6);
					sexStr = parseInt(idCardNo.substr(14, 1), 10) % 2 ? "M" : "F";
			  	} else {
			    	tmpStr = idCardNo.substring(6, 14);
			    	tmpStr = tmpStr.substring(0, 4) + "-" + tmpStr.substring(4, 6) + "-" + tmpStr.substring(6);
					sexStr = parseInt(idCardNo.substr(16, 1), 10) % 2 ? "M" : "F";
			  	}
			  	return {
				    birth: tmpStr,
				    sex: sexStr
				};
		    },
		    //身份证号合法性验证
		    //支持15位和18位身份证号
		    //支持地址编码、出生日期、校验位验证
		    identityCardValidate: function (code) {
		      	var code = $.trim(code);
		      	var city = {11: "北京",12: "天津",13: "河北",14: "山西",15: "内蒙古",21: "辽宁",22: "吉林",23: "黑龙江 ",31: "上海",32: "江苏",33: "浙江",34: "安徽",35: "福建",36: "江西",37: "山东",41: "河南",42: "湖北 ",43: "湖南",44: "广东",45: "广西",46: "海南",50: "重庆",51: "四川",52: "贵州",53: "云南",54: "西藏 ",61: "陕西",62: "甘肃",63: "青海",64: "宁夏",65: "新疆",71: "台湾",81: "香港",82: "澳门",91: "国外 "};
		      	var tip = "";
		      	var pass = true;
		      	if (code) {
			        if (code.length == 15 && !/^\d{8}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])\d{3}$/i.test(code)) {
			          	pass = false;
			        } else if (code.length != 15 && !/^\d{6}(18|19|20)\d{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])\d{3}(\d|X)$/i.test(code)) {
			          	pass = false;
			        } else if (!city[code.substr(0, 2)]) {
			          	pass = false;
			        } else {
			          	//18位身份证需要验证最后一位校验位
			          	if (code.length == 18) {
				            code = code.split('');
				            //∑(ai×Wi)(mod 11)
				            //加权因子
				            var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
				            //校验位
				            var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
				            var sum = 0;
				            var ai = 0;
				            var wi = 0;
				            for (var i = 0; i < 17; i++) {
				              	ai = code[i];
				              	wi = factor[i];
				              	sum += ai * wi;
				            }
				            var last = parity[sum % 11];
				            if (parity[sum % 11] != code[17]) {
				              	pass = false;
				            }
			          	}
			        }
		      	}
		      	return pass;
		    },
		},
		//分析并获取单个字段
		getFieldName: {
			//分析获取手机号
	        phone: function (dataRow) {
	            var reg = /(1[3587]\d{9})/,
	                matchArr = dataRow.match(reg);
	                return matchArr && matchArr.length > 0 ? $.trim(matchArr[0]) : ""
	        },
	        //分析获取中文名字
	        cnname: function (dataRow) {
	            var c = /((?!\d)(?![a-zA-Z])[\u4E00-\u9FBF]\s*){2,4}(?=[a-zA-Z\d.\/\s]+|$)/;
	            var	b = /男性|女性|Famale|Female|Male|护照|身份证|港澳通行证|台胞证|军官证|其他|\s+男|\s+女/gi;
	            dataRow = dataRow.replace(b, "");//过滤干扰信息
	            var	d = dataRow.match(c);
	            return d && d.length > 0 ? $.trim(d[0].replace(/\s*/g, "")) : ""
	        },
	        //分析获取英文名字
	        enname: function (dataRow) {
	            var e,
	            	b = /\s*(([a-zA-Z]{2,}[\s\/]*)+)(?=[.\s]+|$)/,
	                c = dataRow.replace(/\,|\，|\.|\。|\//g, " ").match(b),
	                d = /ADULT|CHILD|ADT|CHD|Famale|Female|Male|CHN|\s+MR\s*|\s+MS\s*|(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\/+/gi;
	            return c && c.length > 0 ? ( e = $.trim(c[0].replace(d, "")), e.indexOf("/") < 0 ? e.replace(/,|，|\s+/g, " ") : e.replace(/,|，/g, " ")) : ""
	        },
	        //分析获取生日
	        birth: function (a) {
	            var b, c, d, f, h,
	            	e = {JAN: 1,FEB: 2,MAR: 3,APR: 4,MAY: 5,JUN: 6,JUL: 7,AUG: 8,SEP: 9,OCT: 10,NOV: 11,DEC: 12},
	            	//i方法识别格式1999-09-09，以\/.- 这四个符号分割
	            	i = /(19\d{2}|20[0][0-9]|201[012345])[\/.-]((0{0,1}[1-9])|(1[0-2]))[\/.-](([1-2][0-9])|(3[0-1])|(0{0,1}[1-9]))/,
	            	i2 = /\s+(19\d{2}|20[0][0-9]|201[012345])[\/.-]((0{0,1}[1-9])|(1[0-2]))[\/.-](([1-2][0-9])|(3[0-1])|(0{0,1}[1-9]))/,
	            	//j方法识别格式1980年7月25
	            	j = /(19\d{2}|20[0][0-9]|201[012345])[年]((0{0,1}[1-9])|(1[0-2]))[月](([1-2][0-9])|(3[0-1])|(0{0,1}[1-9]))/,
	            	j2 = /\s+(19\d{2}|20[0][0-9]|201[012345])[年]((0{0,1}[1-9])|(1[0-2]))[月](([1-2][0-9])|(3[0-1])|(0{0,1}[1-9]))/,
	            	//k方法识别格式19800725
	            	k = /(19\d{2}|20[0][0-9]|201[012345])(0[1-9]|1[0-2]{1})([1-2][0-9]|3[0-1]|0[1-9])/,
	            	k2 = /\s+(19\d{2}|20[0][0-9]|201[012345])(0[1-9]|1[0-2]{1})([1-2][0-9]|3[0-1]|0[1-9])/,
	            	//l方法识别格式25/JUL/1980 以\/.-这四个符号分割 25/7/1980 25/JUL/80 25-JUL-80 25/7/80
	            	l = /(0{0,1}[1-9]|[1-2][0-9]|3[0-1])[\/.-](0{0,1}[1-9]|1[0-2]|[a-zA-Z]{3,})[\/.-]((19\d{2}|20[0][0-9]|201[012345])|(1[012345]|[03456789]\d))/,
	            	l2 = /\s+(0{0,1}[1-9]|[1-2][0-9]|3[0-1])[\/.-](0{0,1}[1-9]|1[0-2]|[a-zA-Z]{3,})[\/.-]((19\d{2}|20[0][0-9]|201[012345])|(1[012345]|[03456789]\d))/,
	            	//g方法识别01-02-1999，以\/.- 这四个符号分割 1999-01-02
	            	g = /(0{0,1}[1-9]|1[0-2]|[a-zA-Z]{3,})[\/.-](0{0,1}[1-9]|[1-2][0-9]|3[0-1])[\/.-]((19\d{2}|20[0][0-9]|201[012345])|(1[012345]|[03456789]\d))/,
	            	g2 = /\s+(0{0,1}[1-9]|1[0-2]|[a-zA-Z]{3,})[\/.-](0{0,1}[1-9]|[1-2][0-9]|3[0-1])[\/.-]((19\d{2}|20[0][0-9]|201[012345])|(1[012345]|[03456789]\d))/,
	            	m;
                if(b = a.match(i2), b && b.length > 0){ 
                	return $.trim(b[0].replace(/[.\/]/g, "-"));
                }
                else if(b = a.match(j2), b && b.length > 0){ 
                	return $.trim(b[0].replace(/[年月]/g, "-"));
                }
                else if(b = a.match(k2), b && b.length > 0){ 
                	return $.trim(b[1] + "-" + b[2] + "-" + b[3]);
                }
                else if(b = a.match(l2), b && b.length > 3){ 
                	return c = b[2].toUpperCase(), e[c] && (c = e[c]), f = b[3], 2 == f.length && (m = f.substr(0, 1), f = "0" == m || "1" == m ? "20" + f : "19" + f), $.trim(f + "-" + c + "-" + b[1])
                }
                else if(b = a.match(g2), b && b.length > 3){ 
                	return d = b[2], c = b[1].toUpperCase(), e[c] && (c = e[c]), f = b[3], 2 == f.length && (h = f.substr(0, 1), f = "0" == h || "1" == h ? "20" + f : "19" + f), $.trim(f + "-" + c + "-" + d)
                }else if(b = a.match(i), b && b.length > 0){ 
                	return $.trim(b[0].replace(/[.\/]/g, "-"));
                }
                else if(b = a.match(j), b && b.length > 0){ 
                	return $.trim(b[0].replace(/[年月]/g, "-"));
                }
                else if(b = a.match(k), b && b.length > 0){ 
                	return $.trim(b[1] + "-" + b[2] + "-" + b[3]);
                }
                else if(b = a.match(l), b && b.length > 3){ 
                	return c = b[2].toUpperCase(), e[c] && (c = e[c]), f = b[3], 2 == f.length && (m = f.substr(0, 1), f = "0" == m || "1" == m ? "20" + f : "19" + f), $.trim(f + "-" + c + "-" + b[1])
                }
                else if(b = a.match(g), b && b.length > 3){ 
                	return d = b[2], c = b[1].toUpperCase(), e[c] && (c = e[c]), f = b[3], 2 == f.length && (h = f.substr(0, 1), f = "0" == h || "1" == h ? "20" + f : "19" + f), $.trim(f + "-" + c + "-" + d)
                }else{
                	return ''
                }
	            
	        },
	        //分析获取性别
	        gender: function (dataRow) {
	            var c,
	            	b = /\s+(男|女|男性|女性|Famale|Female|Male|F|M|MR|MS|MRS|MISS)(?=\s+|$)/i,
            		b2 = /(男|女|男性|女性|Famale|Female|Male|F|M|MR|MS|MRS|MISS)/i;
            		c = dataRow.match(b) || dataRow.match(b2);
            		c = c && c.length > 0 ? $.trim(c[0]) : "";
            	if (c){
            		switch ($.trim(c[0]).toLowerCase()) {
                        case "女":
                        case "女性":
                        case "f":
                        case "famale":
                        case "female":
                        case "ms":
                        case "mrs":
                        case "miss":
                            c = "F";
                            break;
                        default:
                            c = "M"
                    }
            	}
	            return c;
	        },
	        //验证中国护照
	        certPassport: function(dataRow){
	        	var dataRow = dataRow.toUpperCase();
	        	var checkRole = /P\d{7}|G\d{8}|S\d{7,8}|D\d+|1[4,5]\d{7}/;
	        	var arrPassPort = dataRow.match(checkRole);
	        	return arrPassPort && arrPassPort.length>0 ? arrPassPort[0] : ''
	        },
	        //分析获取身份证
	        certIDCode: function(dataRow){
	        	var dataRow = dataRow.replace(/х|ｘ|x/g, "X");
	        	console.log('身份证'+dataRow)
	        	//首先判断15位和18位身份证
	        	var isIDCard = /([1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx])|([1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx])/; 
	        	var arrIDCard = dataRow.match(isIDCard);
	        	return arrIDCard && arrIDCard.length>0 ? arrIDCard[0] : ''
	        },
	        //分析获取证件号
	        certCode: function (dataRow) {
	            var b = /\d{15,18}[xX]?|[a-zA-Z]{1,2}\d{6,11}|[Ll]\d{17}|\d{2}[a-zA-Z]{2}\d{5}|\s+(?!19|20)\d{7,10}(?=[.\/\s]+|$)/,  
	            	c;
	            
	            c = dataRow.match(b);
	            return c && c.length > 0 ? $.trim(c[0]) : ""
	        },
	        //分析获取证件类型
	        certType: function (dataRow) {
	            var b = /\s+(护照|身份证|港澳通行证|台胞证|军官证|其他)(?=\s+|$)/,
	            	d = /(护照|身份证|港澳通行证|台胞证|军官证|其他)(?=\s+|$)/,
	                c = dataRow.match(b) || dataRow.match(d);
	            return c && c.length > 0 ? $.trim(c[0]) : ""
	        }
	    },
	}
	paste.init()
})