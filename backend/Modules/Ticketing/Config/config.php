<?php

return [
    'name' => 'Ticketing',

    // Nombre de tickets ouverts par défaut avant alerte
    'max_open_tickets_per_agent' => 20,

    // Mots-clés pour la priorisation automatique
    'high_priority_keywords' => ['urgent', 'critique', 'critical', 'emergency', 'urgence', 'panne', 'bloqué', 'bloquant'],

    // Sources possibles de ticket
    'sources' => ['web', 'email', 'phone', 'chatbot', 'manual'],
];
