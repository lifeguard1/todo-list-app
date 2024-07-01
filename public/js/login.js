$(document).ready(function() {
    const signup_p = $('.signup-p');
    const login_p = $('.login-p');
    const container = $('.container');
    const card = $('.card');
    const loginContainer = $('.login-container');
    const registerContainer = $('.register-container');

    signup_p.click(function() {
        card.addClass("flipped");
        adjustCardHeight();
        container.css('margin-top', '50px');
    });

    login_p.click(function() {
        card.removeClass("flipped");
        adjustCardHeight();
        container.css('margin-top', '30px');
    });

    function adjustCardHeight() {
        const loginHeight = loginContainer.outerHeight();
        const registerHeight = registerContainer.outerHeight();
        const maxHeight = Math.max(loginHeight, registerHeight);
        card.height(maxHeight);
    }

    adjustCardHeight();
});
