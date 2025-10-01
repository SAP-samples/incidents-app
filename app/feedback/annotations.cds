using FeedbackService as service from '../../srv/feedback-service';
using from '@sap/cds/common';

annotate service.IncidentsForFeedback with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Incident ID',
                Value : originalIncidentID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Title',
                Value : title,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Customer',
                Value : customer,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Customer Email',
                Value : customerEmail,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Closed At',
                Value : closedAt,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Urgency',
                Value : urgency,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Processing Time (hours)',
                Value : processingTime,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Category',
                Value : category,
            },
        ],
    },
    UI.FieldGroup #FeedbackGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Rating',
                Value : rating,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Feedback',
                Value : feedback,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'FeedbackFacet',
            Label : 'Feedback & Rating',
            Target : '@UI.FieldGroup#FeedbackGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Incident ID',
            Value : originalIncidentID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Title',
            Value : title,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Customer',
            Value : customer,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Customer Email',
            Value : customerEmail,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Closed At',
            Value : closedAt,
        },
    ],
    UI.SelectionFields: [
        originalIncidentID,
        customer,
        urgency,
        feedbackProvided
    ],
    UI.PresentationVariant: {
        $Type: 'UI.PresentationVariantType',
        SortOrder: [
            {
                Property: closedAt,
                Descending: true
            }
        ],
        RequestAtLeast: [
            feedbackProvided
        ]
    },
    UI.HeaderInfo: {
        TypeName: 'Incident Feedback',
        TypeNamePlural: 'Incident Feedbacks',
        Title: { Value: title },
        Description: { Value: customer }
    },
);

// Make rating field use a dropdown with proper values
annotate service.IncidentsForFeedback with {
    rating @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'RatingValues',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : rating,
                    ValueListProperty : 'Value',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'Description',
                }
            ],
        },
        Common.ValueListWithFixedValues : true
    );
    feedback @(
        UI.MultiLineText : true
    );
};

