const container = document.getElementById('upgradeContainer');

container.innerHTML = `
    <div class="container">
        <h2>Upgrade Your Account</h2>
        <p>You currently have ${current} apps. Your allowed max: ${max_apps}</p>

        <form method="POST">
            <label>Enter Promo Code:</label>
            <input type="text" name="promo" placeholder="Promo Code">
            <button type="submit">Apply Promo</button>
        </form>

        <button onclick="alert('💳 Payment option is under development. Please use a promo code to get more slots.')">
            Pay $1 to Upgrade
        </button>

        <div class="payment-options">
            <img src="https://img.icons8.com/?size=100&id=13608&format=png&color=000000" alt="Visa">
            <img src="https://img.icons8.com/?size=100&id=3EFzPFftonWA&format=png&color=000000" alt="Mastercard">
        </div>

        <div class="decorations">
            <p>Accepted Payment Methods (Coming Soon)</p>
        </div>
    </div>
`;

