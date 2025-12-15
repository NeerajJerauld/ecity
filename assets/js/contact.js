document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('enquiry-form');
  const successMessage = document.getElementById('form-success');
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerText;

  // Formspree endpoint provided by user
  const API_URL = 'https://formspree.io/f/manrkzdj'; 

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // reset states
    submitButton.disabled = true;
    submitButton.innerText = 'Sending...';
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      if (API_URL === 'YOUR_WORKER_URL_HERE') {
         throw new Error('Please deploy the Worker and update the API_URL in assets/js/contact.js');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Success
        form.reset();
        form.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth' });
      } else {
        const result = await response.json();
        const errorMessage = result.error + (result.details ? '\nDetails: ' + result.details : '');
        alert(errorMessage || 'Something went wrong. Please try again.');
        submitButton.disabled = false;
        submitButton.innerText = originalButtonText;
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error: ' + error.message);
      submitButton.disabled = false;
      submitButton.innerText = originalButtonText;
    }
  });
});
