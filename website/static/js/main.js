/* ═══════════════════════════════════════════
   Dropzy — client-side SPA router + UI logic
   ═══════════════════════════════════════════ */

/* ═══════ SPA Router ═══════ */
(function(){
    document.addEventListener('click', function(e){
        var link = e.target.closest('a');
        if(!link) return;
        var href = link.getAttribute('href');
        if(!href) return;
        if(href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript')) return;
        if(e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();

        var path = href.replace(/\.html$/, '');
        if(path === 'index') path = '/';
        if(!path.startsWith('/')) path = '/' + path;

        navigateTo(path);
    });

    window.addEventListener('popstate', function(){
        loadPage(location.pathname, false);
    });

    function navigateTo(path){
        // Allow query strings (for success?email=...)
        var cleanPath = path.split('?')[0];
        if(cleanPath === location.pathname && !path.includes('?')) return;
        history.pushState(null, '', path);
        loadPage(path, true);
    }

    function loadPage(path, animate){
        var cleanPath = path.split('?')[0];
        var file = cleanPath === '/' ? '/index.html' : cleanPath + '.html';
        var container = document.querySelector('.main .container');
        if(!container) { location.href = file; return; }

        if(animate){
            container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            container.style.opacity = '0';
            container.style.transform = 'translateY(6px)';
        }

        var delay = animate ? 200 : 0;

        setTimeout(function(){
            fetch(file).then(function(r){
                if(!r.ok) throw new Error(r.status);
                return r.text();
            }).then(function(html){
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var newContent = doc.querySelector('.main .container');
                var newTitle = doc.querySelector('title');

                if(newContent) container.innerHTML = newContent.innerHTML;
                if(newTitle) document.title = newTitle.textContent;

                updateNav(cleanPath);
                initPageScripts();

                requestAnimationFrame(function(){
                    container.style.opacity = '0';
                    container.style.transform = 'translateY(6px)';
                    requestAnimationFrame(function(){
                        container.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                        container.style.opacity = '1';
                        container.style.transform = 'translateY(0)';
                    });
                });

                window.scrollTo({top: 0, behavior: 'smooth'});

                var ov = document.getElementById('mobileOverlay');
                if(ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }

            }).catch(function(){
                location.href = file;
            });
        }, delay);
    }

    window.navigateTo = navigateTo;
})();


/* ═══════ Nav indicator (sliding underline) ═══════ */
(function(){
    var nav = document.querySelector('.nav');
    if(!nav) return;

    var indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    nav.appendChild(indicator);

    window.updateNav = function(path){
        var links = nav.querySelectorAll('.nav-link');
        var activeLink = null;

        links.forEach(function(link){
            var href = link.getAttribute('href').replace(/\.html$/, '');
            if(href === 'index') href = '/';
            if(!href.startsWith('/')) href = '/' + href;

            if(href === path){
                link.classList.add('active');
                activeLink = link;
            } else {
                link.classList.remove('active');
            }
        });

        if(activeLink){
            var navRect = nav.getBoundingClientRect();
            var linkRect = activeLink.getBoundingClientRect();
            indicator.style.width = linkRect.width + 'px';
            indicator.style.left = (linkRect.left - navRect.left) + 'px';
            indicator.style.opacity = '1';
        } else {
            indicator.style.opacity = '0';
        }
    };

    var path = location.pathname === '/' || location.pathname.endsWith('index.html') ? '/' : location.pathname;
    updateNav(path);
})();


/* ═══════ Mobile menu ═══════ */
(function(){
    var btn=document.getElementById('mobileMenuBtn'),
        ov=document.getElementById('mobileOverlay');
    if(!btn||!ov)return;
    btn.addEventListener('click',function(){
        var open=ov.classList.toggle('open');
        document.body.style.overflow=open?'hidden':'';
    });
})();


/* ═══════ Toast ═══════ */
function showToast(msg,dur){
    dur=dur||3500;
    var c=document.getElementById('toastContainer');if(!c)return;
    var t=document.createElement('div');t.className='toast';t.textContent=msg;c.appendChild(t);
    setTimeout(function(){t.classList.add('toast-out');t.addEventListener('animationend',function(){t.remove();});},dur);
}


/* ═══════ Online counter ═══════ */
(function(){
    var el=document.getElementById('onlineCount');if(!el)return;
    function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
    function calc(){
        var h=new Date().getHours(),base,spread;
        if(h>=2&&h<6){base=180;spread=40;}
        else if(h>=6&&h<10){base=220+(h-6)*35;spread=30;}
        else if(h>=10&&h<18){base=380;spread=60;}
        else if(h>=18&&h<23){base=320-(h-18)*10;spread=50;}
        else{base=200;spread=35;}
        var seed=Math.floor(Date.now()/300000);
        var r=mulberry32(seed);
        return base+Math.floor(r()*spread*2)-spread;
    }
    var current=calc();
    el.textContent=current;
    setInterval(function(){
        var delta=Math.random()<0.85?(Math.random()<0.5?-1:1):(Math.random()<0.5?-2:2);
        current=Math.max(150,Math.min(550,current+delta));
        el.textContent=current;
    },8000+Math.floor(Math.random()*4000));
})();


/* ═══════ Helpers ═══════ */
function fieldError(inp,msg){
    inp.classList.add('error');
    var el=document.createElement('div');el.className='form-error';el.textContent=msg;
    inp.parentElement.appendChild(el);
}
function clearErrors(form){
    form.querySelectorAll('.form-error').forEach(function(e){e.remove();});
    form.querySelectorAll('.error').forEach(function(e){e.classList.remove('error');});
}
function fmtBytes(b){
    if(b>=1073741824)return(b/1073741824).toFixed(1)+' GB';
    if(b>=1048576)return(b/1048576).toFixed(1)+' MB';
    if(b>=1024)return(b/1024).toFixed(1)+' KB';
    return b+' B';
}


/* ═══════ Page-specific init (called after every SPA nav) ═══════ */
function initPageScripts(){
    initUploadZone();
    initLoginForm();
    initRegisterForm();
    initSuccessPage();
    initResendButton();
    initContactForm();
}

function initUploadZone(){
    var zone=document.getElementById('uploadZone'),
        input=document.getElementById('uploadInput'),
        browseBtn=document.getElementById('uploadBtn');
    if(!zone||!input)return;
    if(browseBtn)browseBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();input.click();});
    zone.addEventListener('click',function(e){if(e.target!==browseBtn)input.click();});
    ['dragenter','dragover'].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.add('dragover');});});
    ['dragleave','drop'].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.remove('dragover');});});
    zone.addEventListener('drop',function(e){if(e.dataTransfer.files.length)simulateUpload(e.dataTransfer.files[0]);});
    input.addEventListener('change',function(){if(input.files.length)simulateUpload(input.files[0]);});
}

function simulateUpload(file){
    var prog=document.getElementById('uploadProgress'),
        nameEl=document.getElementById('uploadFileName'),
        sizeEl=document.getElementById('uploadFileSize'),
        fill=document.getElementById('uploadFill'),
        pct=document.getElementById('uploadPercent'),
        cancel=document.getElementById('uploadCancel');
    if(!prog)return;
    prog.style.display='block';
    nameEl.textContent=file.name;sizeEl.textContent=fmtBytes(file.size);
    fill.style.width='0%';fill.style.background='';pct.textContent='0%';
    var cancelled=false,progress=0,stop=15+Math.floor(Math.random()*10);
    function tick(){
        if(cancelled)return;
        if(progress<stop){
            var inc=progress>stop-5?0.2+Math.random()*0.5:0.5+Math.random()*2;
            progress=Math.min(progress+inc,stop);
            fill.style.width=progress.toFixed(1)+'%';pct.textContent=Math.floor(progress)+'%';
            setTimeout(tick,80+Math.random()*120);
        }else{
            fill.style.background='var(--red)';pct.textContent='Ошибка';
            setTimeout(function(){showToast('Войдите в аккаунт для загрузки файлов');setTimeout(function(){navigateTo('/login');},1500);},600);
        }
    }
    setTimeout(tick,300);
    if(cancel)cancel.onclick=function(){cancelled=true;prog.style.display='none';fill.style.background='';fill.style.width='0%';};
}

function initLoginForm(){
    var form=document.getElementById('loginForm');if(!form)return;
    form.addEventListener('submit',function(e){
        e.preventDefault();clearErrors(form);
        var email=form.querySelector('[name="email"]'),pw=form.querySelector('[name="password"]'),ok=true;
        if(!email.value||email.value.indexOf('@')===-1){fieldError(email,'Введите корректный email');ok=false;}
        if(!pw.value||pw.value.length<6){fieldError(pw,'Минимум 6 символов');ok=false;}
        if(!ok)return;
        var errBox=document.getElementById('loginError');if(errBox)errBox.style.display='block';
    });
}

function initRegisterForm(){
    var form=document.getElementById('registerForm');if(!form)return;
    var saved=sessionStorage.getItem('dropzy_reg_email');
    if(saved){navigateTo('/success?email='+encodeURIComponent(saved));return;}
    form.addEventListener('submit',function(e){
        e.preventDefault();clearErrors(form);
        var email=form.querySelector('[name="email"]'),pw=form.querySelector('[name="password"]'),
            pw2=form.querySelector('[name="password2"]'),agree=form.querySelector('[name="agree"]'),ok=true;
        if(!email.value||email.value.indexOf('@')===-1){fieldError(email,'Введите корректный email');ok=false;}
        if(!pw.value||pw.value.length<6){fieldError(pw,'Минимум 6 символов');ok=false;}
        if(pw.value!==pw2.value){fieldError(pw2,'Пароли не совпадают');ok=false;}
        if(agree&&!agree.checked){showToast('Необходимо принять условия использования');ok=false;}
        if(!ok)return;
        sessionStorage.setItem('dropzy_reg_email',email.value);
        sessionStorage.setItem('dropzy_reg_ts',Date.now().toString());
        navigateTo('/success?email='+encodeURIComponent(email.value));
    });
}

function initSuccessPage(){
    var el=document.getElementById('regEmail');if(!el)return;
    var params=new URLSearchParams(window.location.search);
    var email=params.get('email');
    if(email)el.textContent=email;
}

function initResendButton(){
    var btn=document.getElementById('resendBtn');if(!btn)return;
    var COOLDOWN=86400,tsKey='dropzy_resend_ts';
    function remaining(){var ts=parseInt(sessionStorage.getItem(tsKey)||'0',10);if(!ts)return 0;var diff=COOLDOWN-Math.floor((Date.now()-ts)/1000);return diff>0?diff:0;}
    function fmtTime(sec){var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
    function upd(){var r=remaining();if(r>0){btn.disabled=true;btn.classList.add('disabled');btn.textContent='Повторно через '+fmtTime(r);}else{btn.disabled=false;btn.classList.remove('disabled');btn.textContent='Отправить повторно';}}
    btn.addEventListener('click',function(){if(remaining()>0)return;sessionStorage.setItem(tsKey,Date.now().toString());showToast('Письмо отправлено повторно');upd();});
    upd();setInterval(upd,1000);
}

function initContactForm(){
    var form=document.getElementById('contactForm');if(!form)return;
    form.addEventListener('submit',function(e){
        e.preventDefault();clearErrors(form);
        var email=form.querySelector('[name="email"]'),msg=form.querySelector('[name="message"]'),ok=true;
        if(!email.value||email.value.indexOf('@')===-1){fieldError(email,'Введите корректный email');ok=false;}
        if(!msg.value.trim()){fieldError(msg,'Введите сообщение');ok=false;}
        if(!ok)return;
        document.getElementById('contactCard').style.display='none';
        document.getElementById('contactSent').style.display='block';
    });
}

/* ═══════ Init on first load ═══════ */
initPageScripts();
