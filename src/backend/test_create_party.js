// Native fetch in Node 18+

const API_BASE = 'http://localhost:5000';

async function testCreateParty() {
    try {
        // 1. Login
        console.log('Logging in as Kumar...');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Kumar', password: 'password123' }) // Assuming default test password
        });

        const loginData = await loginRes.json();

        if (!loginData.token) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Got Token:', token.substring(0, 10) + '...');

        // 2. Create Party
        console.log('Creating Party...');
        const partyPayload = {
            party_name: "Test Party Debug " + Date.now().toString().slice(-4),
            type: "customer",
            gstin_no: "20AAAAA0000A1Z5",
            billing_address: "Test Address",
            supply_state_code: "ThisIsWayTooLongForVarchar10",
            gstin_no: "MaybeTooLong",
            vendore_code: null,
            pin_code: 826001,
            contact_person: "John Doe",
            mobile_no: "9876543210"
        };

        const res = await fetch(`${API_BASE}/createParty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(partyPayload)
        });

        console.log('Response Status:', res.status);
        const data = await res.json().catch(e => ({ error: 'Invalid JSON response' }));
        console.log('Response Body:', data);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testCreateParty();
