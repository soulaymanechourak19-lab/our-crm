<!DOCTYPE html>
<html>
<head>
    <title>Your Quotation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Hello {{ $quotation->customer?->name ?? $quotation->lead?->contact_name }},</h2>
    
    <p>Please find details regarding your quotation <strong>{{ $quotation->number }}</strong> ({{ $quotation->title }}).</p>
    
    <div style="margin: 20px 0;">
        <p><strong>Total Amount:</strong> ${{ number_format($quotation->total, 2) }}</p>
        <p><strong>Valid Until:</strong> {{ $quotation->valid_until ? $quotation->valid_until->format('F d, Y') : 'N/A' }}</p>
    </div>

    <p>If you have any questions or wish to proceed, please reply to this email.</p>
    
    <p>Best regards,<br>{{ $quotation->creator->name ?? 'The Sales Team' }}</p>
</body>
</html>
