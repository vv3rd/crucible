// Optimal Recognition Point
export interface ORPAlgorithm {
    determineFor(word: string): number;
}

export interface PacingAlgorithm {
    paceSentence(sentence: string, rate: number): [word: string, time: number][];
}

class ReadGoodORP implements ORPAlgorithm {
    // https://github.com/wasade/readgood
    determineFor(word: string): number {
        const { length } = word;
        if (length == 2) {
            return 2;
        }
        if (length < 6) {
            return Math.ceil(length / 2);
        }
        if (length % 2 !== 0) {
            return Math.floor(length / 2);
        }
        return length / 2;
    }
}

class GlanceORP implements ORPAlgorithm {
    // https://github.com/Miserlou/Glance
    determineFor(word: string): number {
        switch (word.length) {
            case 1:
                return 1;
            case 2:
            case 3:
            case 4:
            case 5:
                return 2;
            case 6:
            case 7:
            case 8:
            case 9:
                return 3;
            case 10:
            case 11:
            case 12:
            case 13:
                return 4;
            default:
                return 5;
        }
    }
}

class SpritsItORP implements ORPAlgorithm {
    // https://github.com/the-happy-hippo/sprits-it
    determineFor(word: string): number {
        return Math.round((word.length + 1) * 0.4) - 1;
    }
}

export const orpOptions: ORPAlgorithm[] = [new ReadGoodORP(), new GlanceORP(), new SpritsItORP()];
