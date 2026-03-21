<!DOCTYPE html>
<html>
<head>
    <title>Lead Expiration Warning</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Lead Expiration Warning</h2>
    
    <p>Hello {{ $lead->creator->name ?? 'Agent' }},</p>
    
    <p>This is a reminder that the following lead is expiring soon and requires your attention:</p>
    
    <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #ff9800; background: #fff8e1;">
        <p><strong>Company:</strong> {{ $lead->company_name }}</p>
        <p><strong>Contact:</strong> {{ $lead->contact_name }}</p>
        <p><strong>Status:</strong> {{ ucfirst($lead->status) }} / {{ ucfirst($lead->source) }}</p>
        <p><strong>Expires On:</strong> <span style="color: #d32f2f; font-weight: bold;">{{ $lead->expires_at->format('F d, Y') }}</span></p>
    </div>

    <p>Please follow up with this lead and update their status, or extend their expiration date in the CRM.</p>
</body>
</html>
