// 2021年1月11日 20点29分
var a_get = getGETArray();
var g_s_audio_path = '.';
var g_localKey = 'setu_';
// 本地储存前缀
var g_config = local_readJson('config', {
    user: undefined,
    icon: undefined,
});

  function cutString(str, s, e) {
        var i_start = str.indexOf(s);
        if (i_start != -1) {
            i_start += s.length;
            var i_end = str.indexOf(e, i_start);
            if (i_end != -1) {
                return str.substr(i_start, i_end - i_start);
            }
        }
        return '';
    }

function getGETArray() {
    var a_result = [], a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}

function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if(data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}


function getTimeString(s){
    s = Number(s);
    var h = 0, m = 0, d = 0;
    if(s >= 86400){
        d = parseInt(s / 86400);
        s %= 86400;
    }    
    if(s >= 3600){
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if(s >= 60){
        m = parseInt(s / 60);
        s %= 60;
    }
    if(m <= 0) m = 1;
    return _s2(d, '日')+_s2(h, '时')+_s2(m, '分')+'前';
}


function local_readJson(key, defaul = '') {
    if(!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}

function getLocalItem(key, defaul = '') {
    var r = null;
    if(window.localStorage){
        r = localStorage.getItem(g_localKey + key);
    }
    return r === null ? defaul : r;
}

function setLocalItem(key, value) {
    if(window.localStorage){
       return localStorage.setItem(g_localKey + key, value);
    }
    return false;
}

function _s2(s, j = ''){
    s = parseInt(s);
    return (s == 0 ? '' : s + j) ;
}

function randNum(min, max){
    return parseInt(Math.random()*(max-min+1)+min,10);
}

function getNow(){
    return parseInt(new Date().getTime() / 1000);
}

