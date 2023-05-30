// QUESTION: How should this relate to MessageType?
export enum DataHandlerType {
    MP_EVENT = 'mp_event', // QUESTION: Is this a PageEvent?
    COMMERCE_EVENT = 'commerce_event', // QUESTION: Does this map to MessageType 16?
    BREADCRUMB = 'breadcrumb', // QUESTION: Should this map to MessageType?
}
