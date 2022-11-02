import { Component, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { ApiService } from 'src/app/api.service';
import { KvService } from '../kv.service';
import { PercentRecordsService } from '../percent-records.service';

interface ToggleForm {
  status: boolean | null,
  text: string | null,
  color: string | null,
}
@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentComponent implements OnInit {

  dateNow: any
  DataMachine: any = []
  DataChart: any
  lastData: any
  selectData: any

  min: any
  max: any
  typ: any

  limit: number = 3600;

  chartOption!: EChartsOption
  toggle: ToggleForm = {
    status: true,
    text: 'REALTIME ON',
    color: 'primary'
  }
  kv: any
  kvItem: any = ['kv1', 'kv2', 'kv3', 'kv4', 'kv5']

  spinner: boolean = false
  constructor(
    private api: ApiService,
    private kvService: KvService,
    private percentService: PercentRecordsService
  ) {
    this.dateNow = new Date().toLocaleString(),
      this.kvService.kv$.subscribe(kv => this.kv = kv)
  }



  ngOnInit(): void {
    this.startPage()

    setInterval(async () => {
      this.dateNow = new Date().toLocaleString()
      const second = new Date().getSeconds()

      if (second == 0 && this.toggle.status) {

        const lastData: any = await this.getByLimit()
        if (lastData && this.lastData && lastData[0]._id != this.lastData._id) {
          const data: any = {
            obj: {
              date: {
                $gte: lastData[0].date
              }
            },
            kv: this.kv
          }
          this.DataMachine = await this.getDataMachine(data)

          const data2 = {
            limit: this.limit,
            obj: {
              key: this.selectData.key
            },
            kv: this.kv

          }
          this.DataChart = await this.getDataMachine(data2)
          const setting: any = await this.getSetting(this.selectData.key)
          this.mapDataChart(this.DataChart, setting[0])
        }
      }
    }, 1000);
  }

  async startPage() {
    this.spinner = true
    this.kv = 'kv1'
    this.setPercent()
    const res1: any = await this.getByLimit()
    if (res1 && res1.length > 0) {
      this.lastData = res1[0]
      this.selectData = res1[0]

      const data: any = {
        obj: {
          date: {
            $gte: res1[0].date
          }
        },
        kv: this.kv

      }
      this.DataMachine = await this.getDataMachine(data)
      const data2 = {
        limit: this.limit,
        obj: {
          key: this.selectData.key
        },
        kv: this.kv

      }
      this.DataChart = await this.getDataMachine(data2)
      const setting: any = await this.getSetting(this.selectData.key)


      this.min = setting.length > 0 ? setting[0].min : null
      this.max = setting.length > 0 ? setting[0].max : null
      this.typ = null
      this.mapDataChart(this.DataChart, setting[0])
      setTimeout(() => {
        this.spinner = false
      }, 1000);
    }

  }

  getByLimit() {
    return new Promise(resolve => {
      const data = {
        limit: 1,
        kv: this.kv

      }
      this.api.postDataMachine(data).subscribe((res => {
        resolve(res)
      }))
    })

  }
  private getDataMachine(data: any) {
    return new Promise(resolve => {
      this.api.postDataMachine(data).subscribe((res => {
        resolve(res)
      }))
    })

  }
  private getSetting(key: any) {
    return new Promise(resolve => {
      const query: any = {
        obj: {
          key: key
        },
        kv: this.kv

      }
      this.api.postSettingDataMachine(query).subscribe(res => resolve(res))
    })
  }



  async mapDataChart(data: any, setting: any) {

    try {
      data.reverse()
      const xLabel: any = await this.chartSetXLabel(data)

      let max: any = []
      let min: any = []
      let typ: any = []
      if (setting) {
        max = await this.setMax(data, setting)
        min = await this.setMin(data, setting)
        typ = await this.setTyp(data, setting)
      }
      const value: any = await this.chartSetSeries(data, setting)
      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        dataZoom: [
          {
            type: 'slider',
            show: true,
            start: 94,
            end: 100,
            handleSize: 8
          },
          {
            type: 'inside',
            start: 94,
            end: 100
          },
          {
            type: 'slider',
            show: true,
            yAxisIndex: 0,
            filterMode: 'empty',
            width: 12,
            height: '70%',
            handleSize: 8,
            showDataShadow: false,
            left: '93%'
          }
        ],
        xAxis: {
          type: 'category',
          data: xLabel,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            animation: true,
            name: 'Max',
            data: max,
            type: 'line',


          },
          {
            animation: true,
            name: this.selectData.key,
            data: value,
            type: 'line',
          },
          {
            animation: true,
            name: 'Typ',
            data: typ,
            type: 'line',
          },
          {
            animation: true,
            name: 'Min',
            data: min,
            type: 'line',
          },

        ],
        legend: {
          // data: ['Max', this.selectData.key, 'Typ,', 'Min',]
        },
      }

    } catch (error) {

    }
  }

  async selectKv(kv: any) {
    // this.kv = kv;

    this.spinner = true
    this.kvService.setKv(kv)
    this.setPercent()
    const res1: any = await this.getByLimit()
    if (res1.length == 0) {
      this.lastData = null
      this.selectData = null
      this.DataMachine = []
    } else {
      this.lastData = res1[0]
      this.selectData = res1[0]
      const data: any = {
        obj: {
          date: {
            $gte: res1[0].date
          }
        },
        kv: this.kv

      }

      this.DataMachine = await this.getDataMachine(data)

      const data2 = {
        limit: this.limit,
        obj: {
          key: this.selectData.key
        },
        kv: this.kv

      }
      this.DataChart = await this.getDataMachine(data2)
      const setting: any = await this.getSetting(this.selectData.key)
      this.min = setting.length > 0 ? setting[0].min : null
      this.max = setting.length > 0 ? setting[0].max : null
      this.typ = null
      this.mapDataChart(this.DataChart, setting[0])
    }
    setTimeout(() => {
      this.spinner = false
    }, 1000);

  }
  private setPercent() {
    const data = {
      kv: this.kv
    }
    this.api.getCount(data).subscribe(res => {
      const count: number = res
      const percent: any = ((count / 20000) * 100).toFixed(2)
      this.percentService.setPercent(percent)
    })
  }
  private chartSetXLabel(data: any) {
    return new Promise(resolve => {
      const xLabel: any = data.map((d: any) => {
        const dd1 = new Date(d.date).getHours()
        const dd2 = new Date(d.date).getMinutes()
        const dd3: any = `${dd1}:${dd2}`;
        return dd3
      })
      resolve(xLabel)
    })
  }
  private setMax(data: any, setting: any) {
    return new Promise(resolve => {
      const max: any = data.map((d: any) => setting.max)
      resolve(max)
    })
  }
  private setMin(data: any, setting: any) {
    return new Promise(resolve => {
      const min: any = data.map((d: any) => setting.min)
      resolve(min)
    })
  }
  private setTyp(data: any, setting: any) {
    return new Promise(resolve => {
      const typ: any = data.map((d: any) => setting.typ)
      resolve(typ)
    })
  }
  private chartSetSeries(data: any, setting: any) {
    return new Promise(resolve => {
      const temp: any = data.map((d: any) => d.value)
      resolve(temp)
    })
  }

  async onClickBtn(item: any, index: number) {
    this.selectData = item
    const data2 = {
      limit: this.limit,
      obj: {
        key: this.selectData.key
      },
      kv: this.kv
    }
    this.DataChart = await this.getDataMachine(data2)
    const setting: any = await this.getSetting(this.selectData.key)
    this.min = setting.length > 0 ? setting[0].min : null
    this.max = setting.length > 0 ? setting[0].max : null
    this.typ = null
    this.mapDataChart(this.DataChart, setting[0])
  }

  set() {
    const query: any = {
      kv: this.kv,
      obj: {
        key: this.selectData.key,
        min: this.min,
        max: this.max
      },
      key: this.selectData.key
    }
    this.api.putSettingDataMachine(query).subscribe(res => {
      this.onClickBtn(this.selectData, 0)
    })
  }
  reset() {
    const query: any = {
      kv: this.kv,
      data: {
        key: this.selectData.key
      }
    }
    this.api.deleteSettingDataMachine(query).subscribe(res => {
      this.onClickBtn(this.selectData, 0)
    })
  }


  pipeKv(kv: any) {
    let newWord = ''
    switch (kv) {
      case 'kv1':
        newWord = 'page 1'
        break;
      case 'kv2':
        newWord = 'page 2'
        break;
      case 'kv3':
        newWord = 'page 3'
        break;
      case 'kv4':
        newWord = 'page 4'
        break;
      case 'kv5':
        newWord = 'page 5'
        break;
      default:
        newWord = 'empty'
        break;
    }
    return newWord
  }

  active(kv: any) {
    if (kv === this.kv) return true
    return false
  }

  onToggle() {
    this.toggle.status = !this.toggle.status;
    if (this.toggle.status) this.toggle.text = 'REALTIME ON'
    if (!this.toggle.status) this.toggle.text = 'REALTIME OFF'
  }


}
