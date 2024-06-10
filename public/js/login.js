const signup_p = $('.signup-p');
const login_p = $('.login-p');

signup_p.click(function(){
    $('.register-container').css("display", "flex");
    $('.login-container').css("display", "none");
});

login_p.click(function(){
    $('.login-container').css("display", "flex");
    $('.register-container').css("display", "none");
});