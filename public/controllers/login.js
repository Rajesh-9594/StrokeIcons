        //logout function
    function logout() {
        fetch('/logout', {
                method: 'POST',
            })
            .then(response => {
                if (response.ok) {
                    // Redirect to the login page on the client side
                    window.location.href = '/';
                } else {
                    console.error('Logout failed');
                }
            })
            .catch(error => {
                console.error(error);
            });
    }


    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const messageElement = document.getElementById('success-message');
        const errorElement = document.getElementById('error-message');



        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
              event.preventDefault();
              const email = document.getElementById('username').value;
        
              try {
                const response = await fetch('/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email, 
                  }),
                });
        
                const data = await response.json();
        
                if (data.success) {
                  messageElement.textContent = 'Login successful';
                  setTimeout(() => {
                    messageElement.textContent = '';
                  }, 3000);
                  window.location.href = '/icons';
                } else {
                  errorElement.textContent = data.message;
                  setTimeout(() => {
                    errorElement.textContent = '';
                  }, 3000);
                }
              } catch (error) {
                console.error(error);
                errorElement.textContent = 'An error occurred. Please try again later.';
                setTimeout(() => {
                  errorElement.textContent = '';
                }, 3000);
              } finally {
                loginForm.reset();
              }
            });
          }

        // Logout function
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }

        checkLoginStatus();

        function checkLoginStatus() {
            fetch('/icons')
                .then(response => {
                    if (!response.ok) {
                        window.location.href = '/';
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }

    });




