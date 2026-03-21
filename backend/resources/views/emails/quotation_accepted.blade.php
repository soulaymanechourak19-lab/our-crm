<!DOCTYPE html>
<html>
<head>
    <title>Quotation Accepted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Quotation Accepted</h2>
    
    <p>Great news! Quotation <strong>{{ $quotation->number }}</strong> for <strong>{{ $quotation->customer?->name ?? $quotation->lead?->contact_name }}</strong> has been formally accepted.</p>
    
    <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #4CAF50; background: #f9f9f9;">
        <p><strong>Title:</strong> {{ $quotation->title }}</p>
        <p><strong>Total Value:</strong> ${{ number_format($quotation->total, 2) }}</p>
    </div>

    <p>Please log in to the CRM to convert this quotation into a transaction and proceed with fulfillment.</p>
</body>
</html>
