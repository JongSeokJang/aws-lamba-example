const json2csv = require('json2csv');
const AWS = require('aws-sdk');
var mysql     = require('mysql');
var excel = require('node-excel-export');

var s3 = new AWS.S3();
Processor = {};
Processor.initializeConnection = function(){
  Processor.connection = mysql.createConnection({
    host	 : 'xxxx',
    port   : 3306,
    user	 : 'xxxx',
    password : 'xxxx',
    database : 'xxxx'
  });
  Processor.connection.connect();
};

Processor.disconnect = function () {
	Processor.connection.end(function(err) {
		console.log("Disconnect.");
	});
};

var styles = {
  headerDark: {
    fill: {
      fgColor: {
        rgb: 'FF000000'
      }
    },
    font: {
      color: {
        rgb: 'FFFFFFFF'
      },
      sz: 13,
      bold: true,
    }
  }
};

exports.handler = function(event, context, callback){
    var user_type = event.query.user_type;
    var dataset = [];
    var specification = {};
    var sql
    var sql_input = []

    if( user_type == 'G'){
        sql  = "SELECT A.user_name, A.user_num, A.user_id, A.user_pass, B.user_name, A.post_num, A.address, A.phone_num1, A.phone_num2, A.user_type "
        sql += "FROM user_info AS A, user_info AS B"
        sql += "WHERE A.manager_num = B.user_num AND A.user_type =? "
        sql_input = ['G']
    }
    else if( user_type == 'B'){
        sql  = "SELECT user_name, user_num, user_id, user_pass, post_num, address, phone_num1, phone_num2, user_type FROM user_info "
        sql += "WHERE user_type = ? "
        sql_input = ['B']
    }
    else{

    }

    specification = {
        user_num:{
            displayName : "고유번호",
            headerStyle: styles.headerDark,
            width: 140 // <- width in pixels
        },
        user_type:{
            displayName : "유저구분",
            headerStyle: styles.headerDark,
            width: 60 // <- width in pixels
        },
        user_id:{
            displayName : "ID",
            headerStyle: styles.headerDark,
            width: 100 // <- width in pixels
        },
        user_name:{
            displayName : "이름/병의원명",
            headerStyle: styles.headerDark,
            width: 50 // <- width in pixels
        },
        manager_num:{
            displayName : "담당자",
            headerStyle: styles.headerDark,
            width: 60 // <- width in pixels
        },
        phone_num1:{
            displayName : "전화번호1",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
        phone_num2:{
            displayName : "전화번호2",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
        post_num:{
            displayName : "우편번호",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
        address:{
            displayName : "주소",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
        delivery1:{
            displayName : "배송업체1",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
        delivery2:{
            displayName : "배송업체2",
            headerStyle: styles.headerDark,
            width: 200 // <- width in pixels
        },
    }

    console.log(sql)
    Processor.initializeConnection();
    Processor.connection.query(sql, sql_input, function(err, results){

        if(err){
            console.log(err);
            Processor.disconnect();
            callback(null, JSON.stringify({"result":"-2"}));
        }
        else{
          // console.log(results);
            Processor.disconnect();
            var tmp_obj={};

            for( ii=0; ii<results.length; ii++ ){

                if( user_type == 'G'){
                    tmp_obj={
                        user_num    : results[ii].user_num,
                        user_type   : results[ii].user_type,
                        user_id     : results[ii].user_id,
                        user_name   : results[ii].user_name,
                        manager_name: results[ii].manager_name,
                        phone_num1  : results[ii].phone_num1,
                        phone_num2  : results[ii].phone_num2,
                        post_num    : results[ii].post_num,
                        address     : results[ii].address
                        // delivery1   : results[ii].delivery1,
                        // delivery2   : results[ii].delivery2
                    };
                    dataset.push(tmp_obj);
                }
                else if( user_type == "B"){
                    tmp_obj={
                        user_num    : results[ii].user_num,
                        user_type   : results[ii].user_type,
                        user_id     : results[ii].user_id,
                        user_name   : results[ii].user_name,
                        phone_num1  : results[ii].phone_num1,
                        phone_num2  : results[ii].phone_num2,
                        post_num    : results[ii].post_num,
                        address     : results[ii].address
                        // delivery1   : results[ii].delivery1,
                        // delivery2   : results[ii].delivery2
                    };
                    dataset.push(tmp_obj);
                }
                else{

                }
            }
          // var csv = json2csv({data: contents, fields:fields});
            var report = excel.buildExport(
                [{
                    specification: specification, // <- Report specification
                    data: dataset // <-- Report data
                }]
            );

            var params = {
                'Bucket':'biopama',
                'Key': 'order_list/user_list.xlsx', // 저장될 이름 명
                'ACL':'public-read',  //  권한
                'Body' : report,
                'ContentEncoding' : 'ANSI',
                'ContentType': 'binary/octet-stream'
            }

            s3.upload(params, function(err, result){
                if(err){
                    console.log("err: ",err);
                    callback(null, JSON.stringify({"result":"-1"}));
                }else{
                    console.log("result: ",result);
                    callback(null, JSON.stringify({"result" : result.Location}));
                }
            })
        }
  });
};
