/* ═══ NavPrompts — Frontend JS ═══ */

(function () {
    'use strict';

    /* ── Cover Banner Slider (5s loop) — baaki banners page load ke BAAD ── */
    var slides = document.querySelectorAll('.cover-slider .cover-slide');
    if (slides.length > 1) {
        var startSlider = function () {
            // Baaki banners ab load karo (LCP ke baad — mobile speed ke liye)
            slides.forEach(function (img) {
                if (img.dataset.src && !img.src) img.src = img.dataset.src;
            });
            var slideIdx = 0;
            setInterval(function () {
                slides[slideIdx].classList.remove('active');
                slideIdx = (slideIdx + 1) % slides.length;
                slides[slideIdx].classList.add('active');
            }, 5000);
        };
        if (document.readyState === 'complete') setTimeout(startSlider, 1200);
        else window.addEventListener('load', function () { setTimeout(startSlider, 1200); });
    }

    /* ── Load More (homepage) ── */
    document.querySelectorAll('.load-more').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var type = btn.dataset.type;
            var offset = parseInt(btn.dataset.offset, 10);
            var target = document.getElementById(btn.dataset.target);
            if (!target) return;

            btn.disabled = true;
            var orig = btn.textContent;
            btn.textContent = 'Loading…';

            fetch('api/load_more.php?type=' + type + '&offset=' + offset)
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.html) {
                        target.insertAdjacentHTML('beforeend', res.html);
                    }
                    btn.dataset.offset = offset + (res.count || 0);
                    if (res.has_more) {
                        btn.disabled = false;
                        btn.textContent = orig;
                    } else {
                        btn.parentElement.remove();
                    }
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = orig;
                });
        });
    });

    /* ── Community: share (copy link) ── */
    document.querySelectorAll('.share-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var link = btn.dataset.link;
            navigator.clipboard.writeText(link).then(function () {
                var orig = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                setTimeout(function () { btn.innerHTML = orig; }, 1800);
            }).catch(function () {
                prompt('Copy this link:', link);
            });
        });
    });

    /* ── Community: attached file name dikhana ── */
    document.querySelectorAll('.composer-attach input[type=file]').forEach(function (inp) {
        inp.addEventListener('change', function () {
            var span = inp.parentElement.querySelector('.attach-name');
            if (inp.files.length) {
                var f = inp.files[0];
                if (f.size > 20 * 1024 * 1024) {
                    alert('File too large! Max 20MB allowed.');
                    inp.value = '';
                    span.textContent = '';
                    return;
                }
                span.textContent = ' ✓ ' + f.name;
            } else {
                span.textContent = '';
            }
        });
    });

    /* ── Copy prompt button ── */
    var copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        var showCopied = function () {
            copyBtn.textContent = '✅ Copied!';
            copyBtn.classList.add('btn-copied');
            // Toast popup
            var toast = document.createElement('div');
            toast.className = 'copy-toast';
            toast.textContent = '✅ Prompt copied to clipboard!';
            document.body.appendChild(toast);
            setTimeout(function () { toast.classList.add('show'); }, 10);
            setTimeout(function () {
                toast.classList.remove('show');
                setTimeout(function () { toast.remove(); }, 400);
            }, 2200);
            setTimeout(function () {
                copyBtn.textContent = '📋 Copy Prompt';
                copyBtn.classList.remove('btn-copied');
            }, 2200);
        };

        copyBtn.addEventListener('click', function () {
            var content = document.getElementById('prompt-content');
            if (!content) return;
            var text = content.innerText;
            navigator.clipboard.writeText(text).then(showCopied).catch(function () {
                // Fallback for older browsers
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showCopied();
            });
        });
    }

    /* ── Image lightbox ── */
    var lightbox = document.getElementById('lightbox');
    if (lightbox) {
        var lbImg = lightbox.querySelector('img');
        document.querySelectorAll('.lb-img').forEach(function (img) {
            img.addEventListener('click', function () {
                lbImg.src = img.src;
                lightbox.classList.add('open');
            });
        });
        lightbox.addEventListener('click', function () {
            lightbox.classList.remove('open');
        });
    }

    /* ── Razorpay checkout ── */
    var payBtn = document.getElementById('pay-btn');
    if (payBtn && window.NP_CHECKOUT) {
        var msg = document.getElementById('pay-msg');

        function showMsg(text, isError) {
            if (msg) {
                msg.textContent = text;
                msg.style.display = 'block';
                msg.style.color = isError ? '#fca5a5' : '#86efac';
            }
        }

        payBtn.addEventListener('click', function () {
            payBtn.disabled = true;
            payBtn.textContent = 'Processing…';

            fetch('api/create_order.php', { method: 'POST' })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.error) {
                        showMsg(res.error, true);
                        payBtn.disabled = false;
                        payBtn.textContent = 'Subscribe Now';
                        return;
                    }

                    var options = {
                        key: res.key_id,
                        name: 'PromptsClub',
                        description: 'PromptsClub Pro Membership',
                        prefill: { name: res.user_name, email: res.user_email },
                        theme: { color: '#6366f1' },
                        handler: function (response) {
                            verifyPayment(response, res.type);
                        },
                        modal: {
                            ondismiss: function () {
                                payBtn.disabled = false;
                                payBtn.textContent = 'Subscribe Now';
                            }
                        }
                    };

                    if (res.type === 'subscription') {
                        options.subscription_id = res.subscription_id;
                    } else {
                        options.order_id = res.order_id;
                        options.amount = res.amount;
                        options.currency = res.currency;
                    }

                    var rzp = new Razorpay(options);
                    rzp.open();
                })
                .catch(function () {
                    showMsg('Network error. Please try again.', true);
                    payBtn.disabled = false;
                    payBtn.textContent = 'Subscribe Now';
                });
        });

        function verifyPayment(response, type) {
            showMsg('Verifying your payment, please wait…', false);

            var data = new FormData();
            data.append('razorpay_payment_id', response.razorpay_payment_id || '');
            data.append('razorpay_signature', response.razorpay_signature || '');
            data.append('type', type);
            if (type === 'subscription') {
                data.append('razorpay_subscription_id', response.razorpay_subscription_id || '');
            } else {
                data.append('razorpay_order_id', response.razorpay_order_id || '');
            }

            fetch('api/verify_payment.php', { method: 'POST', body: data })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.success) {
                        paymentSuccess();
                    } else {
                        fallbackCheck(res.error);
                    }
                })
                .catch(function () {
                    fallbackCheck(null);
                });
        }

        function fallbackCheck(prevError) {
            // Server se seedha Razorpay check — browser verify fail hua toh bhi activate ho jayega
            showMsg('Confirming payment with the bank…', false);
            fetch('api/check_payment.php')
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.success) {
                        paymentSuccess();
                    } else {
                        supportMsg(prevError);
                    }
                })
                .catch(function () {
                    supportMsg(prevError);
                });
        }

        function paymentSuccess() {
            showMsg('✅ Payment successful! Your premium access is now active. Redirecting…', false);
            setTimeout(function () { window.location.href = 'account.php'; }, 1500);
        }

        function supportMsg(prevError) {
            if (msg) {
                msg.style.display = 'block';
                msg.style.color = '#DC2626';
                msg.innerHTML = (prevError || 'We could not confirm your payment automatically.') +
                    '<br><br><strong>If money was deducted, don\'t worry — your access will be activated.</strong><br>' +
                    'Message us on WhatsApp: <a href="https://wa.me/919131421048" target="_blank" style="color:#16A34A;font-weight:700;">+91 91314 21048</a>';
            }
            payBtn.disabled = false;
            payBtn.textContent = 'Try Again';
        }
    }
})();
