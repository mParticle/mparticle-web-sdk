export default class Audience {
    public audience_id: number;

    constructor(
        audience_id: number,
        expiration_timestamp_ms?: number
    ) {
        this.audience_id = audience_id;
        this.expiration_timestamp_ms = expiration_timestamp_ms || null;
    }
}
