<!DOCTYPE html>
<html>
<head>
    <title>Welcome Discount</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to Our CRM, {{ $customer->name }}!</h2>
    <p>Thank you for choosing us.</p>
    <p>As a special welcome gift, we are delighted to offer you a <strong>10% discount</strong> on your next purchase!</p>
    
    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">{{ $customer->customerDiscounts->first()?->discount?->code ?? 'WELCOME10' }}</span>
    </div>

    <p>This code is valid for 30 days and can be used once.</p>
    
    <p>Best regards,<br>The CRM Team</p>
</body>
</html>
