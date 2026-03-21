<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quotation {{ $quotation->number }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 14px; margin: 0; padding: 0; }
        .container { width: 100%; padding: 30px; }
        .header { border-bottom: 2px solid #0056b3; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #0056b3; float: left; }
        .title { text-align: right; font-size: 28px; color: #555; text-transform: uppercase; float: right; }
        .clear { clear: both; }
        .info-section { margin-bottom: 30px; width: 100%; }
        .company-info { float: left; width: 50%; }
        .client-info { float: right; width: 50%; text-align: right; }
        .meta-data { margin-bottom: 30px; width: 100%; background: #f9f9f9; padding: 15px; border: 1px solid #eee; }
        .meta-data table { width: 100%; }
        .meta-data td { padding: 5px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table.items th { background: #0056b3; color: white; padding: 10px; text-align: left; border: 1px solid #004494; }
        table.items td { padding: 10px; border: 1px solid #ddd; }
        .totals { float: right; width: 40%; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 8px; border-bottom: 1px solid #eee; }
        .totals .total-row { font-weight: bold; font-size: 18px; border-bottom: 2px solid #0056b3; color: #0056b3; }
        .notes { margin-top: 50px; padding: 15px; background: #f9f9f9; border-left: 4px solid #0056b3; }
        .footer { margin-top: 50px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Our CRM</div>
            <div class="title">Quotation</div>
            <div class="clear"></div>
        </div>

        <div class="info-section">
            <div class="company-info">
                <strong>From:</strong><br>
                Our CRM Company<br>
                123 Business Avenue<br>
                Tech City, TC 12345<br>
                contact@our-crm.com
            </div>
            <div class="client-info">
                <strong>To:</strong><br>
                @if($quotation->customer)
                    {{ $quotation->customer->name }}<br>
                    {{ $quotation->customer->email }}<br>
                    {{ $quotation->customer->phone }}
                @elseif($quotation->lead)
                    {{ $quotation->lead->company_name }}<br>
                    Attn: {{ $quotation->lead->contact_name }}<br>
                    {{ $quotation->lead->email }}<br>
                    {{ $quotation->lead->phone }}
                @endif
            </div>
            <div class="clear"></div>
        </div>

        <div class="meta-data">
            <table>
                <tr>
                    <td><strong>Quotation No:</strong> {{ $quotation->number }}</td>
                    <td><strong>Date:</strong> {{ $quotation->created_at->format('F d, Y') }}</td>
                    <td><strong>Valid Until:</strong> {{ $quotation->valid_until ? $quotation->valid_until->format('F d, Y') : 'N/A' }}</td>
                </tr>
                <tr>
                    <td colspan="3"><strong>Project:</strong> {{ $quotation->title }}</td>
                </tr>
            </table>
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 15%; text-align: right;">Unit Price</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($quotation->items as $item)
                <tr>
                    <td>
                        <strong>{{ $item->product ? $item->product->name : 'Custom Item' }}</strong>
                        @if($item->description && $item->description !== ($item->product ? $item->product->name : ''))
                            <br><span style="color: #666; font-size: 12px;">{{ $item->description }}</span>
                        @endif
                    </td>
                    <td style="text-align: center;">{{ $item->quantity }}</td>
                    <td style="text-align: right;">${{ number_format($item->unit_price, 2) }}</td>
                    <td style="text-align: right;">${{ number_format($item->total, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="clear"></div>

        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal:</td>
                    <td style="text-align: right;">${{ number_format($quotation->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td>Tax ({{ number_format($quotation->tax_rate, 2) }}%):</td>
                    <td style="text-align: right;">${{ number_format($quotation->tax, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td>Total:</td>
                    <td style="text-align: right;">${{ number_format($quotation->total, 2) }}</td>
                </tr>
            </table>
        </div>

        <div class="clear"></div>

        @if($quotation->description)
        <div class="notes">
            <strong>Notes & Terms:</strong><br>
            {!! nl2br(e($quotation->description)) !!}
        </div>
        @endif

        <div class="footer">
            Generated by {{ $quotation->creator->name ?? 'System' }} on {{ date('Y-m-d H:i') }} | Quotation #{{ $quotation->number }}<br>
            Thank you for your business!
        </div>
    </div>
</body>
</html>
