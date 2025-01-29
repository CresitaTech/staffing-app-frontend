export interface Permission {
    id?: number,
    name: string,
    codename: string
    content_type?: ContentType
}

interface ContentType{
    id?: number,
    app_label: string,
    model: string,
}