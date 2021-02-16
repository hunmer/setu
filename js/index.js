var socket_url = 'wss://setu-server.glitch.me';
// var api_url = 'https://listen-toggle.glitch.me';
// var socket_url = 'ws://192.168.1.3:8000';
var api_url = '.';
var connection;
var g_listPlayer = {};

String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

$(function() {
    init();
    checkLogin()
    // loadImage('img/4.png');
});

function queryMsg(msg, debug = false) {
    connection.send(msg);
    if (debug) console.log(debug);
}

function recon() {
    hsycms.confirm('confirm', '网络状况不稳定，是否刷新？',
        function(res) {
        	window.location.reload()
        	return;
            connection.close();
            connection = new WebSocket(socket_url)
            hsycms.loading('loading', '重连中,');
        },
        function(res) {},
    );
}

function loadPlayers() {
    var html = '';
    for (let name in g_listPlayer) {
        html += `<div class="col-1 pt-1 ml-2 text-center" data-action="selectUser" data-user="` + name + `">
                <span class="badge bg-success source" style="position: absolute;right: 0;top:0;width:fit-content;"></span>

                 <img style="border-radius: 50%; background-size: cover; background-image: ` + g_listPlayer[name].icon.replaceAll('"', '') + `" width="45" height="45">
                <span class="badge bg-primary mt-1 text-center">` + name + `</span>
            </div>`;
    }
    $('.cover_list').html(html);
    for (let newPlayer of _newPlayers) {
        dom_addMsg(newPlayer, ' 加入了房间')
    }
    _newPlayers = [];
    queryMsg('game_status'); // 确认游戏状态
    $(window).resize();
}

var checkPlayerTimer;
var g_b_inited = false;
var _audio;
var g_timer_cd;
var g_i_cd;
var g_s_gameStatus;

function loadImage(url) {
    var img = new Image();
    img.src = url;
    img.onload = (e) => {
        var pic = document.querySelector('#pic');
        pic.style.backgroundImage = 'url(' + url + ')';
        pic.setAttribute('data-width', e.path[0].width);
        pic.setAttribute('data-height', e.path[0].height);
        resizeImage();
    }
    img.onerror = (e) => {

    }
}

function resizeImage() {
    var pic = $('#pic');
    var w = pic.attr('data-width');
    var h = pic.attr('data-height');

    if (w > window.innerWidth) {
        h = window.innerWidth / w * h;
        w = window.innerWidth;

    }
    var mh = window.innerHeight - pic.offset().top - 40;
    if (h > mh) {
        w *= mh / h
        h = mh;
    }
    pic.css('width', w);
    pic.css('height', h);
    $('.tag_layout').css({ width: w, height: h }).find('textarea').each((i, d) => {
        initTextArea($(d));
    });
}

function initTextArea(input) {
    var w = input.width();
    var h = input.height();
    input.css('fontSize', parseInt(w > h ? w / 2.5 : h / 4.1) + 'px');
}

function init() {
    if (g_b_inited) return;
    g_b_inited = true;
    _audio = $('audio')[0];
    connection = new WebSocket(socket_url);
    connection.onopen = () => {
        if (g_config.user) {
            login();
        }
        queryMsg('list');
        hsycms.hideLoading();

        if (checkPlayerTimer) {
            clearInterval(checkPlayerTimer);
        }
        checkPlayerTimer = setInterval(() => {
            queryMsg('game_status');
        }, 3000);

        g_timer_cd = setInterval(() => {
            if (g_i_cd > 0) {
                g_i_cd--;
                var status = '';
                switch (g_s_gameStatus) {
                    case 'waitting':
                        status = '等待加入中...';
                        break;
                    case 'running':
                        status = '游戏中...还剩 ' + g_i_cd + ' 秒';
                        if (g_i_cd == 0) {
                            var datas = {};
                            for (let d of $('.area_show')) {
                                var iw = $('#pic').width();
                                var ih = $('#pic').height();
                                datas[$(d).val()] = getTagPos($(d));
                                d.remove();
                            }
                            queryMsg('tags||' + g_config.user + '||' + JSON.stringify(datas));

                            $('#area_select').hide();
                            g_b_area = false;
                        }
                        break;
                    case 'resetting':
                        status = '评分中...还剩 ' + g_i_cd + ' 秒';
                        break;
                }
                $('#span_status').html(status);
            }
        }, 1000);
    }

    connection.onclose = () => {
        recon();
    }

    connection.onerror = (error) => {
        recon();
    }

    connection.onmessage = (e) => {
        // return;
        console.log(e.data);
        var params = e.data.split('||');
        switch (params[0]) {
            case 'msg':
                dom_addMsg(params[1], params[2]);
                break;

            case 'image':
                dom_addMsg(params[1], '<img src="' + params[2] + '" style="width: 150px;height: auto;background-color: unset;">');
                break;

            case 'pic':
                $('#pic').css('backgroundImage', 'url(' + params[1] + ')');
                break;

            case 'updateIcon':
                $('[data-user="' + params[1] + '"] img').css('backgroundImage', params[2]);
                g_listPlayer[params[1]].icon = params[2];
                break;

            case 'gaming':
                switch (params[1]) {
                    case 'score':
                        $('.cover_list [data-user="' + params[2] + '"] .source').html(params[3]);
                        break;
                    case 'stop':
                        dom_broadcast('游戏人数不足...等待加入中...');
                        break;

                    case 'coll':
                        //dom_broadcast('正在分析数据...');
                        var tags = JSON.parse(params[2]);
                        console.log(tags);
                        break;

                    case 'player': // 玩家回合
                        $('.tag_layout').remove();
                        $('[data-user] span.bg-warning').removeClass('bg-warning').removeClass('blink');
                        $('[data-user="' + params[2] + '"] span').addClass('bg-warning').addClass('blink');
                        break;

                    case 'new':
                        //dom_broadcast('游戏开始');
                        $('.source').html('');
                        $('.tag_layout').remove();
                        loadImage(params[2]);
                        break;

                    case 'vote':
                        // player tag votedplayers
                        $('.tag_layout[data-user="' + params[2] + '"][data-tag="' + params[3] + '"] textarea').html('(' + JSON.parse(params[4]).length + ')' + params[3]);
                        break;

                    case 'tag':
                        // 玩家 标签 数据
                        var pos = JSON.parse(params[4])
                        addTag(params[3], pos.style, params[2]);
                        break;
                    default:
                        // statements_def
                        break;
                }
                break;

            case 'game_status':
                g_s_gameStatus = params[1];
                g_i_cd = parseInt(params[2]);
                break;

            case 'danmu':
                _video.danmu.sendComment(JSON.parse(params[2]));
                break;

            case 'leave':
                dom_addMsg(params[1], '离开了房间');
                $('[data-user="' + params[1] + '"]').remove();
                break;


            case 'list':
                g_listPlayer = JSON.parse(params[1]);
                loadPlayers();
                break;

            case 'status':
                //updateStatus(params[1], params[2], params[3]);
                break;

            case 'broadcast':
                var html;
                switch (params[1]) {
                    case 'msg':
                        dom_broadcast(params[2]);
                        break;
                    case 'login':
                        _newPlayers.push(params[2]);
                        queryMsg('list');
                        break;
                    default:
                        return;
                }
                if (html) dom_broadcast(html);
                break;
        }
    }

    $(window).resize(function(event) {
        resizeImage();
        var b = $('#status_bar').hasClass('width_client');
        if($(this).width() > $(this).height()){
        	if(!b){
        		$('#status_bar').addClass('width_client');
        		$('[data-action="selectUser"] .badge').hide();
        	}
        }else
        if(b){
        	$('#status_bar').removeClass('width_client');
        		$('[data-action="selectUser"] .badge').show();

        }
    });

    $(document).on('click', '[data-action]', function(event) {
            var dom = $(event.currentTarget);
            onAction(dom, dom.attr('data-action'));
        })
        .on('mousedown', '#pic', (event) => {
            g_b_area = true;
            g_areaTimer = setTimeout(() => {
                g_areaTimer = undefined;
                if (g_b_area) {
                    setStart(event.currentTarget, event);
                }
            }, 1000);
        })
        .on('mouseup', (event) => {
            if (g_b_area) {
                g_b_area = false;
                if (!g_areaTimer) setEnd(event);
            }
        })
        .on('touchstart', '#pic', (event) => {
            g_b_area = true;
            g_areaTimer = setTimeout(() => {
                g_areaTimer = undefined;
                if (g_b_area) {
                    setStart(event.currentTarget, event);
                }
            }, 1000);
        })
        .on('touchend', (event) => {
            if (g_b_area) {
                g_b_area = false;
                if (!g_areaTimer) setEnd(event);
            }
        })
        .on('mousemove', (event) => {
            if (g_b_area & !g_areaTimer) {
                setSize(event.currentTarget, event);
            }
        })
        .on('touchmove', (event) => {
            if (g_b_area & !g_areaTimer) {
                setSize(event.currentTarget, event);
            }
        })
        .on('mousedown', '.area_show', (event) => {
            area_delete_confirm(event.currentTarget);
        })
        .on('mouseup', '.area_show', (event) => {
            area_delete_cancel(event.currentTarget);
        })
        .on('touchstart', '.area_show', (event) => {
            area_delete_confirm(event.currentTarget);
        })
        .on('touchend', '.area_show', (event) => {
            area_delete_cancel(event.currentTarget);
        });
    $(window).resize();

}

function area_delete_confirm(dom) {
    if (dom.disabled) return;
    g_timer_deleteArea = setTimeout(() => {
        if (confirm('确定删除吗？')) {
            dom.remove();
        }
    }, 1500);
}

function area_delete_cancel(dom) {
    if (dom.disabled) {
        var target = $(dom).parents('.tag_layout').attr('data-user');
        if (target == g_config.user) {
            _tips('你不能投票给自己');
        } else {
            $(dom).toggleClass('tag_like');
            queryMsg('vote||' + g_config.user + '||' + target + '||' + dom.value);
        }
        return;
    }
    if (g_timer_deleteArea) {
        clearTimeout(g_timer_deleteArea);
        g_timer_deleteArea = undefined;
    }
}

var g_b_area;
var g_area;
var g_areaTimer;


function setStart(dom, ev) {
	if(g_s_gameStatus != 'running') return;
    var x, y, tx, ty;
    if (ev.touches) {
        x = ev.touches[0].clientX;
        y = ev.touches[0].clientY;
    } else {
        x = ev.clientX;
        y = ev.clientY;
    }
    g_area = {
        x: x,
        y: y,
    };

    if (!g_areaTimer) {
        $('#area_select').css({
            left: x,
            top: y,
            display: 'unset'
        });
    }
}

function setSize(dom, ev) {
    var x, y, w, h;
    if (ev.touches) {
        x = ev.touches[0].clientX;
        y = ev.touches[0].clientY;
    } else {
        x = ev.clientX;
        y = ev.clientY;
    }

    var area = $('#area_select');
    if (g_area.x > x) { // x向左
        area.css('left', x);
    }
    if (g_area.y > y) { // x向上
        area.css('top', y);
    }

    w = Math.abs(x - g_area.x);
    h = Math.abs(g_area.y - y);
    area.css({
        width: w,
        height: h,
    });
}

function getTagPos(d) {
    var iw = $('#pic').width();
    var ih = $('#pic').height();
    d = {
        style: {
            left: d.offset().left / iw * 100 + '%',
            top: d.offset().top / ih * 100 + '%',
            width: d.width() / iw * 100 + '%',
            height: d.height() / ih * 100 + '%'
        },
        vote: []
    };
    console.log(d);
    return d;
}

function setEnd(ev) {
    var area = $('#area_select');
    g_b_area = false;
    var tag = prompt('请输入标签');
    if (tag) {
        if ($('[data-tag="' + tag + '"').length == 0) {
            addTag(tag, getTagPos(area).style);
        } else {
            alert('此标签你已标记过');
        }
    }
    area.css({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        display: 'none'
    });
}

function downloadImage(src) {
    var a = $("<a></a>").attr("href", src).attr("download", "img.png").appendTo("body");
    a[0].click();
    a.remove();
}

function addTag(tag, pos, user = '') {
    pos.display = 'block';
    var area = $('#area_select');
    var layout = $(`<div class="tag_layout" data-tag="` + tag + `" style="top: 0px;left: ` + $('#pic').offset().left + `px;position: absolute;width: ` + $('#pic').width() + `px;height: ` + $('#pic').height() + `px;"></div>`);
    var input = area.clone(false).css(pos).addClass('area_show').val(tag);
    if (user) { // 展示用
        // layout.css('top', $('#pic').offset().top+'px');
        // input.css('color', 'blue');
        layout.attr('data-user', user);
        input.prop('disabled', true);
    } else {
        input.prop('disabled', false);
    }
    $('#pic').append(layout.append(input));
    initTextArea(input);
}

function onAction(dom, action) {
    switch (action) {
        case 'selectUser':
            var user = dom.attr('data-user');
            if (user == g_config.user) {
                $('#input_updload')[0].click();
            }
            break;
        case 'download':
            downloadImage($('#pic').css('backgroundImage').replace('url("', '').replace('")', ''));
            break;
        case 'more':
            $('#modal_bottom').modal('show');
            break;
        case 'favorite':
            _tips('开发中..');
            break;
        case 'emoji':
            _tips('开发中..');
            break;
        case 'chat':
            var msg = prompt('输入要发送的消息');
            if (msg) queryMsg('msg||' + g_config.user + '||' + msg);
            break;
        case 'selectImage':
            $('#input_updload1').click();
            break;
    }
}

function updateStatus(user, status, color = 'bg-dark') {
    var span = $('[data-user="' + user + '"]').find('span');
    if (color == 'bg-info') { // 时间特定
        span.attr('data-time', status); // 标记时间
        status = parseInt(status) + '%'; // 取整数
    }
    span.html(status)[0].className = 'badge ' + color;
}

var _newPlayers = [];

function uploadImage(file, send = false) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        if (send) { // 发送图片
            queryMsg('image||' + g_config.user + '||' + e.currentTarget.result);
        } else { // 上传头像
            $('#img_userCover').css('backgroundImage', 'url(' + e.currentTarget.result + ')');
            g_config.icon = $('#img_userCover').css('backgroundImage');
            if (g_listPlayer[g_config.user]) { // 更换头像
                local_saveJson('config', g_config);
                queryMsg('updateIcon||' + g_config.user + '||' + g_config.icon);
            }
        }
    };
}

function soundTip(url) {
    _audio.src = url;
    _audio.play();
}

function dom_addMsg(name, msg) {
    insertHtml(`<li class="list-group-item">
          <span>` + msg + `</span>
          <img id='img_userCover' class="round" style="background-image: ` + g_listPlayer[name].icon.replace('"', '') + `">
      </li>`);
}

function dom_tip(msg) {
    insertHtml(`<li class="list-group-item">
          <span>` + msg + `</span>
          <img id='img_userCover' class="round" style="background-image: url(img/default.png)">
      </li>`);
}

function dom_broadcast(msg) {
    insertHtml(`<li class="list-group-item">
          <span>` + msg + `</span>
          <img id='img_userCover' class="round" style="background-image: url(img/default.png)">
      </li>`);
}

function insertHtml(html) {
    $('#div_chat_list ul').append(html);
    //var dom = $('.msg');
    var dom = $('#div_chat_list');
    dom.animate({ scrollTop: dom[0].scrollHeight + 'px' }, 1000);
    soundTip('./res/pop.mp3');
}

function setCopyText(text) {
    $('#clipboard_content').val(text);
    $('#modal_copy').modal('show');
}

function login() {
    queryMsg('broadcast||login||' + g_config.user + '||' + g_config.icon);
}

function checkUser() {
    var dom = $('#input_user');
    var name = dom.val();
    if (name == '') name = '用户_' + (new Date().getTime());
    if (g_listPlayer[name]) {
        hsycms.error('error', '此名称已被人使用!');
        setFormTip(dom, false, '此名称已被人使用!');
    } else {
        g_config.user = name;
        local_saveJson('config', g_config);
        $('.container').show();
        hsycms.success('success', '设置成功');
        setFormTip(dom, true, '设置成功!');
        $('#modal_user').modal('hide');
        login();
    }
}

function setFormTip(dom, success = false, tip = '') {
    dom.removeClass('is-valid').removeClass('is-invalid');
    dom.addClass(success ? 'is-valid' : 'is-invalid').next(success ? '.valid-feedback' : '.invalid-feedback').html(tip);
}

function loginOut() {
    checkLogin();
}

function checkLogin() {
    hsycms.loading('加载中');
    if (!g_config.user) {
        $('#modal_user').modal({
            backdrop: 'static',
            keyboard: false
        }).modal('show');
    }
}


function getText(text, s, e) {
    var i_s = text.indexOf(s);
    if (i_s != -1) {
        i_s++;
        var i_e = text.indexOf(e, i_s);
        if (i_e != -1) {
            return text.substr(i_s, i_e - i_s);
        }
    }
    return '';
}