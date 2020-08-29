export interface DetectionResponseModel {
    face?: Box;
    isAhegao: boolean;
    ahegaoProbability: number;
    ahegaoProbabilityCompare?: number;
}

export interface Box { // TODO Actually face-api box
    x: number;
    y: number;
    width: number;
    height: number;
}
