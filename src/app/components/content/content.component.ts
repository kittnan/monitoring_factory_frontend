import { Component, OnInit } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { EChartsOption } from 'echarts';
import { ApiService } from 'src/app/api.service';
import { KvService } from '../kv.service';
import { PercentRecordsService } from '../percent-records.service';
import { ThemeService } from '../theme.service';

interface ToggleForm {
  status: boolean | null,
  text: string | null,
  color: ThemePalette,
}
@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
  standalone: false
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
  filterText: string = ''
  currentSetting: any
  private chartData: any

  constructor(
    private api: ApiService,
    private kvService: KvService,
    private percentService: PercentRecordsService,
    private themeService: ThemeService
  ) {
    this.dateNow = new Date().toLocaleString(),
      this.kvService.kv$.subscribe(kv => this.kv = kv)
    this.themeService.theme$.subscribe(() => this.renderChart())
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
      this.currentSetting = setting
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
      this.chartData = { xLabel, value, max, typ, min }
      this.renderChart()

    } catch (error) {

    }
  }

  private renderChart() {
    if (!this.chartData || !this.selectData) return
    const { xLabel, value, max, typ, min } = this.chartData
    const css = getComputedStyle(document.documentElement)
    const c = (name: string) => css.getPropertyValue(name).trim()
    const accent = c('--accent')
    const limitLine = (name: string, data: any, color: string) => ({
      name,
      data,
      type: 'line' as const,
      showSymbol: false,
      animation: true,
      lineStyle: { type: 'dashed' as const, width: 1.5, color },
      itemStyle: { color },
    })

    this.chartOption = {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: 'Source Sans Pro, sans-serif', color: c('--text-muted') },
      grid: { left: 8, right: 16, top: 40, bottom: 64, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: c('--surface'),
        borderColor: c('--border'),
        textStyle: { color: c('--text') },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: c('--border-strong') },
          crossStyle: { color: c('--border-strong') },
          label: { backgroundColor: c('--text-muted'), color: c('--surface') }
        }
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          start: 94,
          end: 100,
          height: 24,
          bottom: 12,
          borderColor: c('--border'),
          fillerColor: c('--accent-soft'),
          backgroundColor: c('--surface-2'),
          dataBackground: {
            lineStyle: { color: c('--border-strong') },
            areaStyle: { color: c('--border') }
          },
          selectedDataBackground: {
            lineStyle: { color: accent },
            areaStyle: { color: c('--accent-soft') }
          },
          handleStyle: { color: c('--surface'), borderColor: accent },
          moveHandleStyle: { color: c('--border-strong') },
          textStyle: { color: c('--text-subtle') }
        },
        {
          type: 'inside',
          start: 94,
          end: 100
        },
      ],
      xAxis: {
        type: 'category',
        data: xLabel,
        boundaryGap: false,
        axisLine: { lineStyle: { color: c('--chart-grid') } },
        axisTick: { show: false },
        axisLabel: { color: c('--chart-axis') },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: c('--chart-axis') },
        splitLine: { lineStyle: { color: c('--chart-grid') } },
      },
      series: [
        limitLine('Max', max, c('--series-max')),
        {
          name: this.selectData.key,
          data: value,
          type: 'line',
          animation: true,
          showSymbol: false,
          smooth: 0.2,
          lineStyle: { width: 2, color: accent },
          itemStyle: { color: accent },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: c('--accent-soft') },
                { offset: 1, color: 'transparent' }
              ]
            }
          },
        },
        limitLine('Typ', typ, c('--series-typ')),
        limitLine('Min', min, c('--series-min')),
      ],
      legend: {
        top: 0,
        left: 0,
        icon: 'roundRect',
        itemWidth: 14,
        itemHeight: 4,
        textStyle: { color: c('--text-muted') },
      },
    }
  }

  filteredDevices() {
    const text = (this.filterText || '').trim().toLowerCase()
    if (!text) return this.DataMachine
    return this.DataMachine.filter((d: any) => String(d.key).toLowerCase().includes(text))
  }

  selectedValue() {
    if (!this.selectData) return null
    const latest = this.DataMachine.find((d: any) => d.key === this.selectData.key)
    return latest ? latest.value : this.selectData.value
  }

  limitState(): 'high' | 'low' | 'ok' | null {
    const s = this.currentSetting
    const value = Number(this.selectedValue())
    const hasMax = s && s.max != null && s.max !== ''
    const hasMin = s && s.min != null && s.min !== ''
    if (!hasMax && !hasMin) return null
    if (hasMax && value > Number(s.max)) return 'high'
    if (hasMin && value < Number(s.min)) return 'low'
    return 'ok'
  }

  scrollTo(el: HTMLElement) {
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
