export interface Variant {
    id: string;
    color: string;
    name: string;
    img: string;
    hex: string;
}

export interface ProductData {
    id: string | number;
    name: string;
    price: number | string;
    img: string;
    variants?: Variant[];
}