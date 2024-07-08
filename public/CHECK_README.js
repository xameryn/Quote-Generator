var company = 'Company Name';
var name = 'Your Name';
var phone = '123.456.7890';
var email = 'email@mail.com';

var personal = {
    company: company,
    name: name,
    phone: phone,
    email: email,
    address: ['Street & Address', 'City, Province/State'], // Address line 1, Address line 2
    tax_names: ['GST', 'PST'],
    tax_rates: [5, 7],
    end_note: `For any concerns, reach out to ${phone} or ${email}`, // Appears at end of quote
    foot_note: 'Thank you for your business', // Appears below the end note in bold
    document_type: 'Quotation' // For use in the title & 'Quotation Reference' etc.
}

export { personal }