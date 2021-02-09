var express = require('express');
var router = express.Router();
var oracledb = require('oracledb');
var dbConfig = require('../config/dbconfig');
var mysql = require('mysql');
var connection = mysql.createConnection(dbConfig);

/* GET home page. */
router.get('/', function (req, res, next) {

  msg = req.session.user_id;
  connection.query('SELECT * FROM member WHERE id = ?', [msg], function (error, row) {

    connection.query('SELECT DISTINCT authority.authDate, member.phone, application.appName, application.appNo FROM member,authority, application WHERE member.id= ? AND member.id = authority.id AND application.appNo = authority.appNo', [msg], function (err, rows) {
      if (err)
        console.error('err', err);
      else {
        if (rows.length == 0) {
          connection.query('SELECT * FROM member, authority,application WHERE member.id = ? AND member.departNum = authority.departNum AND application.appNo = authority.appNo', [msg], function (er, result) {
            if (er) console.error("er", er);
            else {
              res.render('index', {
                msg: msg,
                data: result,
                mem: row,
                division: "부서권한"
              });
            }
          })
        } else {
          res.render('index', {
            msg: msg,
            data: rows,
            mem: row,
            division: "개인권한"
          });
        }
      }
    })
  })
});

//로그인 페이지 
router.get('/login', function (req, res) {
  res.render('login');
})

//로그인 시도 포스트
router.post('/login', function (req, res) {
  var id = req.body.id;
  var pw = req.body.pw;

  // 입력된 아이디와 비밀번호로 구성된 튜플의 개수를 카운트 (count = 1 아이디/비밀번호 정확 , count = 0 아이디/비밀번호 틀림)
  connection.query(`SELECT count(*) cnt, passwordTime from member where id = '${id}' and password='${pw}'`, function (err, rows) {
    if (err) console.error('err', err);
    else {
      var cnt = rows[0].cnt;
      var nowDate = new Date();
      var dbDate = new Date(rows[0].passwordTime);
      var changeday = diff(formatDate(dbDate), formatDate(nowDate))
      if (cnt == 1) {
        if (changeday >= 30) { //비밀번호를 변경한지 30일이 넘었을 경우 알림
          res.send(`<script> alert("비밀번호를 변경한지 30일이 넘었습니다!"); location.href="/changePW/${req.body.id}"; </script>`);
        } else {
          req.session.user_id = id;
          res.send('<script> alert("로그인이 되었습니다."); location.href="/";</script>');
          res.render('index', {
            msg: req.session.user_id
          })
        }
      } else {
        res.send('<script> alert("아이디 혹은 비밀번호가 잘못되었습니다"); history.back();</script>');
      }
    }
  })
})

// 비밀번호를 변경한지 30일이 넘었을때 변경하는 페이지로 이동
router.get('/changePW/:id', function (req, res) {
  console.log(req.params.id);
  res.render('changePW', {
    id: req.params.id
  });
})

//비밀번호 변경 포스트 
router.post('/changePW/:id', function (req, res) {
  var body = req.body;
  var nowDate = new Date();
  var formD = formatDate(nowDate);
  if (body.pw != body.pw2)
    res.send('<script> alert("비밀번호 확인이 맞지않습니다!"); history.back();</script>');
  else {
    // 설정한 비밀번호로 변경하고 비밀번호 변경일자를 오늘날짜로 변경
    connection.query('UPDATE member SET password = ?, passwordTime = ? WHERE id = ?', [body.pw, formD, req.params.id], function (err) {
      if (err) console.error('err', err);
      else {
        res.send('<script> alert("비밀번호 변경이 완료되었습니다!"); location.href="/login";</script>');
      }
    });
  }
})

//로그아웃을 할경우 등록된 세션정보를 파기
router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) console.error('err', err);
    else
      res.send('<script> alert("로그아웃 되었습니다"); location.href="/";</script>');
  })
})

// 개인별 권한부여 페이지 
router.get('/grant', function (req, res) {
  msg = req.session.user_id;
  // 권한부여 페이지는 관리자 계정만 접속가능 
  if (msg == 'Master') {
    // 회원정보와 회원이 속한 부서명을 가져오는 SQL (부서가 없는 사용자가 있기때문에 LEFT JOIN 을 이용 MEMBER 테이블이 기준으로 조인연산을 한다)
    connection.query(`SELECT * FROM member LEFT JOIN department ON department.departNum = member.departNum WHERE id != 'Master'`, function (err, rows) {
      if (err) console.error('err', err);
      else {
        connection.query('SELECT * FROM APPLICATION', function (error, rows1) {
          if (err) console.error('error', error);
          else {
            res.render('grant', {
              data: rows,
              app: rows1,
              msg: msg
            });
          }
        })
      }
    })
  } else {
    res.send('<script> alert("권한이 없습니다"); location.href="/";</script>');
  }
})

//개인에게 권한부여 포스트 
router.post('/grant', function (req, res) {
  var body = req.body
  if (req.body.mycheck == undefined) {
    res.send('<script> alert("대상이 선택되지 않았습니다!!"); history.back();</script>');
  }
  else {
    // checkbox를 하나만 선택한 경우 배열이아니고 여러개 선택한경우 배열로 반환됨 
    if (!Array.isArray(body.mycheck)) {
      connection.query(`INSERT INTO authority(id,appNo) SELECT * FROM (SELECT '${body.mycheck}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT id,appNo FROM authority WHERE id = '${body.mycheck}' AND appNo ='${body.app}') LIMIT 1`, function (err) {
        if (err) console.error('err', err);
        else {
          res.send('<script> alert("권한부여가 완료되었습니다."); history.back();</script>');
        }
      })
    } else {
      if (err) console.error('err', err);
      // 한번에 여러명에게 권한을 부여할 경우 순차적으로 권한부여 
      for (var i = 0; i < body.mycheck.length; i++) {
        if (i != body.mycheck.length - 1)
          connection.query(`INSERT INTO authority(id,appNo) SELECT * FROM (SELECT '${body.mycheck[i]}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT id,appNo FROM authority WHERE id = '${body.mycheck[i]}' AND appNo ='${body.app}') LIMIT 1`);
        else {
          connection.query(`INSERT INTO authority(id,appNo) SELECT * FROM (SELECT '${body.mycheck[i]}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT id,appNo FROM authority WHERE id = '${body.mycheck[i]}' AND appNo ='${body.app}') LIMIT 1`, function (err) {
            if (err) console.error('err', err);
            else {
              res.send('<script> alert("권한부여가 완료되었습니다."); history.back();</script>');
            }
          });
        }
      }
    }
  }
})

//회원정보 상세보기
router.get('/meminfo/:id', function (req, res) {
  connection.query('SELECT * FROM member LEFT JOIN department ON member.departNum = department.departNum WHERE member.id = ?', [req.params.id], function (err, row) {
    connection.query('SELECT DISTINCT member.id, member.address, member.phone, department.departName, application.appName, application.appNo FROM member LEFT JOIN department ON department.departNum = member.departNum ,authority,application WHERE member.id= ? AND member.id = authority.id AND application.appNo = authority.appNo', [req.params.id], function (err, rows) {
      if (err) console.error('err', err);
      else {
        res.render('meminfo', {
          data: rows,
          mem: row
        })
      }
    })
  })
})

//회원에게 부여된 권한을 삭제 
router.get('/delete/:id/:appNo', function (req, res) {
  connection.query('DELETE FROM authority WHERE id = ? AND appNo =? ', [req.params.id, req.params.appNo], function (err, rows) {
    if (err) console.error('err', err);
    else {
      res.send('<script> alert("권한삭제가 완료되었습니다."); history.back();</script>');
    }
  })
})
 
//부서에게 권한을 부여할 수 있는 페이지
router.get('/grantTeam', function (req, res) {
  msg = req.session.user_id
  //부서 권한 부여는 관리자 계정만 가능 
  if (msg == 'Master') {
    // 부서에대한 정보와 부서에 속한 부서원들의 수를 불러오는 질의
    connection.query('SELECT COUNT(member.departNum) AS count, department.* FROM department LEFT JOIN member ON department.departNum = member.departNum GROUP BY member.departNum', function (err, rows) {
      if (err) console.error('err', err);
      else {
        connection.query('SELECT * FROM APPLICATION', function (error, rows1) {
          if (error) console.error('error', error);
          else {
            res.render('grantTeam', {
              data: rows,
              msg: msg,
              app: rows1
            });
          }
        })
      }
    })
  }
  else {
    res.send('<script> alert("권한이 없습니다"); location.href="/";</script>');
  }
})

//부서에대한 상세정보 보기
router.get('/departinfo/:departNum', function (req, res) {
  connection.query('SELECT * FROM department WHERE departNum = ? ', [req.params.departNum], function (error, row) {
    // 부서에 부여된 권한의 목록을 확인하는 질의
    connection.query('SELECT DISTINCT * FROM authority, department,application WHERE department.departNum = authority.departNum AND department.departNum = ? AND application.appNo = authority.appNo;', [req.params.departNum], function (er, row1) {
      //부서에 속한 부서원의 목록을 확인하는 질의
      connection.query('SELECT * FROM department,member WHERE department.departNum = ? AND member.departNum = department.departNum', [req.params.departNum], function (err, rows) {
        if (err) console.error('err', err);
        else {
          res.render('departinfo', {
            data: rows,
            dep: row,
            auth: row1
          })
        }
      })
    })
  })
})

// 부서에대하여 권한을 부여
router.post('/grantTeam', function (req, res) {
  var body = req.body
  if (req.body.mycheck == undefined) {
    res.send('<script> alert("대상이 선택되지 않았습니다!!"); history.back();</script>');
  }
  else {
    if (!Array.isArray(body.mycheck)) {
      connection.query(`INSERT INTO authority(departNum,appNo) SELECT * FROM (SELECT '${body.mycheck}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT departNum,appNo FROM authority WHERE departNum = '${body.mycheck}' AND appNo ='${body.app}') LIMIT 1`, function (err) {
        if (err) console.error('err', err);
        else {
          res.send('<script> alert("권한부여가 완료되었습니다."); history.back();</script>');
        }
      })
    } else {
      for (var i = 0; i < body.mycheck.length; i++) {
        if (i != body.mycheck.length - 1)
          connection.query(`INSERT INTO authority(departNum,appNo) SELECT * FROM (SELECT '${body.mycheck[i]}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT departNum,appNo FROM authority WHERE departNum = '${body.mycheck[i]}' AND appNo ='${body.app}') LIMIT 1`);
        else {
          connection.query(`INSERT INTO authority(departNum,appNo) SELECT * FROM (SELECT '${body.mycheck[i]}', '${body.app}') AS tmp WHERE NOT EXISTS (SELECT departNum,appNo FROM authority WHERE departNum = '${body.mycheck[i]}' AND appNo ='${body.app}') LIMIT 1`, function (err) {
            if (err) console.error('err', err);
            else {
              res.send('<script> alert("권한부여가 완료되었습니다."); history.back();</script>');
            }
          });
        }
      }
    }
  }
})

//부서에 부여된 권한을 삭제
router.get('/grantdelete/:departNum/:appNo', function (req, res) {
  connection.query('DELETE FROM authority WHERE departNum = ? AND appNo =? ', [req.params.departNum, req.params.appNo], function (err, rows) {
    if (err) console.error('err', err);
    else {
      res.send('<script> alert("권한삭제가 완료되었습니다."); history.back();</script>');
    }
  })
})

//테스트하는 페이지 
router.get('/testpage', function (req, res) {
  msg = req.session.user_id
  connection.query('SELECT * FROM application', function (err, rows) {
    if (err) console.error('err', err);
    else {
      res.render('testpage', {
        data: rows,
        msg: msg
      })
    }
  })
})

router.post('/test', function (req, res) {
  var body = req.body;
  connection.query(`SELECT count(*) cnt, passwordTime from member where id = '${body.id}' and password='${body.pw}'`, function (err, rows) {
    if (err) console.error('err', err);
    else {
      var cnt = rows[0].cnt;
      var nowDate = new Date();
      var dbDate = new Date(rows[0].passwordTime);
      var changeday = diff(formatDate(dbDate), formatDate(nowDate))
      if (cnt == 1) {

        if (body.check == undefined) {
          res.send('<script> alert("아무런 앱도 선택되지 않았습니다!"); history.back();</script>');
        } else {
          if (changeday >= 30) {
            res.send(`<script> alert("비밀번호를 변경한지 30일이 넘었습니다!"); location.href="/changePW/${req.body.id}"; </script>`);
          } else {
            //기본적인 공통사항 sql 변수에 정의
            var sql = 'SELECT count(member.id) FROM member, authority WHERE (member.id = ' + `'${body.id}'` + ' AND member.id = authority.id) AND (';
            if (!Array.isArray(body.check)) {
              // 하나의 선택지만 선택된 경우 질의문 완료 
              sql += 'authority.appNo = ' + `'${body.check}'` + ') GROUP BY authority.appNo';
            } else {
              for (var i = 0; i < body.check.length; i++) {
                //선택지의 갯수만큼 비교할 정보 질의문에 추가 
                sql += 'authority.appNo = ' + body.check[i]
                if (i == body.check.length - 1) {
                  // 더이상 추가할 조건이 없다면
                  sql += ') GROUP BY authority.appNo';
                } else {
                  // 아직 추가할 조건이 있다면
                  sql += ' OR ';
                }
              }
            }
            // 개인 권한에 대하여 질의
            connection.query(sql, function (error, result) {
              if (error) {
                console.error('error', error);
              } else {
                // 하나만 선택한 경우 질의문의 결과가 같다면 
                if ((result.length == 1 && !Array.isArray(body.check))) {
                  res.send('<script> alert("인증되었습니다."); history.back();</script>');
                } // 다중선택지를 선택하였을때 결과가 같다면
                else if (result.length == body.check.length) {
                  res.send('<script> alert("인증되었습니다."); history.back();</script>');
                } else {
                  // 개인에게 권한이 하나도없는지 검사
                  connection.query('SELECT count(member.id) FROM member, authority WHERE (member.id = ? AND member.id = authority.id) GROUP BY authority.appNo', [body.id], function (e, r) {
                    if (e) console.error('error!', e);
                    else {
                      // 개인에게 권한이 존재할 경우 
                      if (r.length != 0) {
                        res.send('<script> alert("인증되지 않은 사용자입니다."); history.back();</script>');
                      } else {
                        connection.query('SELECT departNum FROM member departNum WHERE id = ?', [body.id], function (err, resu) {
                          // 부서가 없는경우 부서 권한은 존재하지 않음
                          if (resu[0].departNum == null) {
                            res.send('<script> alert("인증되지 않은 사용자입니다."); history.back();</script>');
                          } else {
                            // 부서 권한검사 
                            var sql1 = 'SELECT count(department.departNum) FROM department, authority WHERE (department.departNum =  ' + `'${resu[0].departNum}'` + ' AND department.departNum = authority.departNum) AND (';
                            if (!Array.isArray(body.check)) {
                              sql1 += 'authority.appNo = ' + `'${body.check}'` + ') GROUP BY authority.appNo';
                            } else {
                              for (var i = 0; i < body.check.length; i++) {
                                sql1 += 'authority.appNo = ' + body.check[i]
                                if (i == body.check.length - 1) {
                                  sql1 += ') GROUP BY authority.appNo';
                                } else {
                                  sql1 += ' OR ';
                                }
                              }
                            }
                            connection.query(sql1, function (error1, departres) {
                              if ((departres.length == 1 && !Array.isArray(body.check))) {
                                res.send('<script> alert("인증되었습니다."); history.back();</script>');
                              } else if (departres.length == body.check.length) {
                                res.send('<script> alert("인증되었습니다."); history.back();</script>');
                              } else {
                                res.send('<script> alert("인증되지 않은 사용자입니다."); history.back();</script>');
                              }
                            })
                          }
                        })
                      }
                    }
                  })
                }
              }
            })
          }
        }
      } else {
        res.send('<script> alert("아이디 혹은 비밀번호가 잘못되었습니다"); history.back();</script>');
      }
    }
  })
})

// 입력된 날짜데이터1과 날짜데이터2를 비교하여 차이나는 날을 비교하는 함수
function diff(value1, value2) {
  // YYYY-MM-DD 형식으로 이루어진 날짜 데이터를 split연산을 이용하여 분할
  var arr1 = value1.split('-');
  var arr2 = value2.split('-');
  // 분할된 연 월 일 데이터를 이용하여 데이트객체 생성
  var dt1 = new Date(arr1[0], arr1[1], arr1[2]);
  var dt2 = new Date(arr2[0], arr2[1], arr2[2]);

  var diff = dt2 - dt1;
  var day = 1000 * 60 * 60 * 24;


  return parseInt(diff / day);
}

//데이터베이스에 저장된 날짜 데이터를 불러온 후 YYYY-MM-DD 형식으로 변환시켜주기 위한 포맷함수  
function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;
  return [year, month, day].join('-');
}

module.exports = router;
