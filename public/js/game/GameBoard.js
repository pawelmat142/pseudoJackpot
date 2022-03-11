import config from '../../gameConfig.json' assert { type: "json" }
import { GameColumn } from "./GameColumn.js"

export class GameBoard {

    constructor(boardGenerator, audioManager) {

        this.board = document.getElementById(config.DOMids.board)
        this.rows = config.board.rows
        this.cols = config.board.cols

        this.boardGenerator = boardGenerator
        this.currentState = this.boardGenerator.getZeroScoreBoard()
        this.audio = audioManager.it

        this.columns = this.currentState.map((columnState, colIndex) => 
            new GameColumn(columnState, this.board, colIndex, this.boardGenerator, this.audio)
        )

        this.spinFlag = false
        this.bet = 0
    }

    get isRolling() {
        let flag = false
        this.columns.forEach(col =>  {if (col.isRolling) flag = true })
        return flag
    }


    spinStart = ()=> {
        if (!this.isRolling) {
            this.spinFlag = false
            return this.columns.map(async col => col.spinStart())
        } else {
            return this.columns.map( el=> ({"interval": 0, "offset": 0}) )
        }
    }


    spinStop = async (spinPromises) => {
        if (!this.spinFlag) {
            let stopPromises = this.columns.map( async(col, i)=> col.spinStop(spinPromises[i]))
            return Promise.all(stopPromises)
        }
    }
    

    setCurrentState = (score) => {
        const state = this.boardGenerator.getBoard(score)
        this.currentState = [...state]
        console.log(state)
        this.columns.forEach((col, i) => col.setState(this.currentState[i]))
    }

    
    // HIGHLIGHTs

    highlightScore = async () => {
        const scoreLines = this.boardGenerator.getScoreLines(this.currentState)
        await sleep(config.spin.highLightInterval*0.3)
        await this.highlightLines(scoreLines)
        await sleep(config.spin.highLightInterval*0.15)
        if (scoreLines.length > 2) await this.highlightLinesTogether(scoreLines)
        if (scoreLines.length > 4) await this.highlightLinesTogether(scoreLines)
        await sleep(config.spin.highLightInterval*0.3)
    }



    highlightLines = async (lines) => {
        let promises = lines.map((line, i) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    this.audio.highlights.play()
                    this.highlightLine(line)
                    resolve()
                }, config.spin.highLightInterval*i)
            })
        })
        return Promise.all(promises)
    }



    highlightLine = (line) => {
        if (Array.from(line).shift() === 'r') {
            const rowIndex = parseInt(Array.from(line).pop())
            this.columns.forEach(col => col.highLight([rowIndex]))
            // this.highlight(rowIndex, this.currentState[0][rowIndex])
            return rowIndex
        }
        if (Array.from(line).shift() === 'x') {
            const index = parseInt(Array.from(line).pop())
            this.columns.forEach((col, ind) => col.highLight([Math.abs(index - ind)]))
            // this.highlight(index, this.currentState[0][index], 'x')
            return index
        }
    }



    highlightLinesTogether = async (lines) => {
        await sleep(config.spin.highLightInterval*1.1)
        this.audio.highlights.play()
        this.audio.highlightsAll.play()
        lines.forEach(line => this.highlightLine(line))
    }



    highlight = (i, item, type) => {
        let score = config.availableItems.filter(el => el.name === item)[0].score * this.bet
        let selector = type === 'x' ? '#game-board > .xxx > .line.x' :  '#game-board > .xxx > .line'
        if (type === 'x' && i>1) i--
        let element = document.querySelectorAll(selector)[i]
        element.querySelector('.right').innerHTML = score
        element.querySelector('.left').innerHTML = score
        if (!element.classList.contains('active')) {
            element.classList.add('active')
            setTimeout(() => {
                if (element.classList.contains('active')) element.classList.remove('active')
            },config.spin.highLightInterval*1.1)
        }
        else {
            setTimeout(() => {
                element.classList.add('active')
                setTimeout(() => {
                    if (element.classList.contains('active')) element.classList.remove('active')
                },config.spin.highLightInterval*1)
            },config.spin.highLightInterval*0.5)
        }
    }

}


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

