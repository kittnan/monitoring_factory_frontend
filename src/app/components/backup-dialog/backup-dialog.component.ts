import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EChartsOption } from 'echarts';
import { ApiService } from 'src/app/api.service';

interface BackupItem {
  date: string,
  rows: number | null,
  size: number,
  updatedAt: string,
}

interface BackupView {
  kv: string,
  date: string,
  columns: string[],
  rows: any[],
}

@Component({
  selector: 'app-backup-dialog',
  templateUrl: './backup-dialog.component.html',
  styleUrls: ['./backup-dialog.component.scss'],
  standalone: false
})
export class BackupDialogComponent implements OnInit {
  items: BackupItem[] = []
  loading = false
  error = ''

  view: BackupView | null = null
  device = ''
  chartOption!: EChartsOption
  stats: { min: number, avg: number, max: number } | null = null

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { kv: string, title: string },
    private api: ApiService
  ) { }

  ngOnInit(): void {
    this.loadList()
  }

  loadList() {
    this.loading = true
    this.error = ''
    this.api.getBackupList(this.data.kv).subscribe({
      next: res => {
        this.items = res || []
        this.loading = false
      },
      error: () => {
        this.error = 'Could not load backups. Check that the backend is updated and running.'
        this.loading = false
      }
    })
  }

  open(item: BackupItem) {
    this.loading = true
    this.error = ''
    this.api.getBackupView(this.data.kv, item.date).subscribe({
      next: (res: BackupView) => {
        this.view = res
        this.device = this.device && res.columns.includes(this.device) ? this.device : res.columns[0] || ''
        this.renderChart()
        this.loading = false
      },
      error: () => {
        this.error = `Could not open the backup for ${item.date}.`
        this.loading = false
      }
    })
  }

  back() {
    this.view = null
    this.error = ''
  }

  fileUrl(date: string) {
    return this.api.backupFileUrl(this.data.kv, date)
  }

  formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  renderChart() {
    if (!this.view || !this.device) {
      this.stats = null
      return
    }
    const labels = this.view.rows.map(r => String(r.date).slice(11, 16))
    const values = this.view.rows.map(r => {
      const v = r[this.device]
      return v === null || v === undefined || v === '' ? null : Number(v)
    })
    const nums = values.filter((v): v is number => v !== null && !isNaN(v))
    this.stats = nums.length
      ? { min: Math.min(...nums), avg: nums.reduce((a, b) => a + b, 0) / nums.length, max: Math.max(...nums) }
      : null

    const css = getComputedStyle(document.documentElement)
    const c = (name: string) => css.getPropertyValue(name).trim()
    const accent = c('--accent')
    this.chartOption = {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: 'Source Sans Pro, sans-serif', color: c('--text-muted') },
      grid: { left: 8, right: 16, top: 16, bottom: 56, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: c('--surface'),
        borderColor: c('--border'),
        textStyle: { color: c('--text') },
      },
      dataZoom: [
        { type: 'slider', height: 20, bottom: 8, borderColor: c('--border'), fillerColor: c('--accent-soft'), backgroundColor: c('--surface-2'), textStyle: { color: c('--text-subtle') } },
        { type: 'inside' },
      ],
      xAxis: {
        type: 'category',
        data: labels,
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
      series: [{
        name: this.device,
        type: 'line',
        data: values,
        showSymbol: false,
        smooth: 0.2,
        lineStyle: { width: 2, color: accent },
        itemStyle: { color: accent },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: c('--accent-soft') }, { offset: 1, color: 'transparent' }]
          }
        },
      }],
    }
  }
}
