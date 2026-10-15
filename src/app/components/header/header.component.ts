import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'src/app/api.service';
import { ExportExcelService } from '../export-excel.service';
import { KvService } from '../kv.service';
import { PercentRecordsService } from '../percent-records.service';
import { Theme, ThemeService } from '../theme.service';
import { BackupDialogComponent } from '../backup-dialog/backup-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {
  password: any
  // percent: any
  progressColor: any
  kv!: string;
  percent!: number

  theme!: Theme

  constructor(
    public dialog: MatDialog,
    private api: ApiService,
    private kvService: KvService,
    private percentService: PercentRecordsService,
    private excelExport: ExportExcelService,
    private themeService: ThemeService
  ) {
    this.percentService.getPercent().subscribe(percent => this.percent = percent),
      this.progressColor = 'primary',
      this.kvService.kv$.subscribe(kv => this.kv = kv)
    this.themeService.theme$.subscribe(theme => this.theme = theme)
  }

  toggleTheme() {
    this.themeService.toggle()
  }

  meterWidth() {
    return Math.min(Math.max(Number(this.percent) || 0, 0), 100)
  }

  meterState() {
    const percent = Number(this.percent)
    if (percent >= 100) return 'meter-danger'
    if (percent >= 80) return 'meter-warn'
    return ''
  }

  ngOnInit(): void {
    setInterval(() => {
      const second = new Date().getSeconds()
      if (second == 0) {
      }
    }, 30000);

  }
  getColorClass() {
    if (Number(this.percent) > 100) return 'warn'
    else return 'primary'
  }

  // private setPercent() {
  //   const data = {
  //     kv: this.kv
  //   }
  //   this.api.getCount(data).subscribe(res => {
  //     const count: number = res
  //     const percent: any = ((count / 20000) * 100).toFixed(2)
  //     // this.percent = percent
  //     this.percentService.setPercent(percent)
  //     this.progressColor = 'primary'
  //     if (Number(percent) > 100) {
  //       this.progressColor = 'warn'
  //     }
  //   })
  // }

  openModal(content: any) {
    this.dialog.open(content, { panelClass: 'app-dialog' })
  }

  openBackups() {
    const page = this.kv ? this.kv.replace('kv', 'Page ') : 'Page 1'
    this.dialog.open(BackupDialogComponent, {
      data: { kv: this.kv || 'kv1', title: page },
      width: '960px',
      maxWidth: '95vw',
      panelClass: 'app-dialog',
      autoFocus: false,
    })
  }

  onDownload() {
    const data = {
      password: this.password
    }
    this.api.postPassword(data).subscribe(async res => {
      if (res && res != 'null') {
        const body = {
          kv: this.kv
        }
        const countRecords: any = await this.onCount(body)
        if (countRecords > 0) {
          // Export only: the nightly auto backup moves records out of the
          // buffer (verified per file), so nothing is deleted here.
          // Fetch the whole buffer and order by date; seq ranges no longer
          // start at 1 once backups have removed older records.
          let records: any = await this.api.postKvRecords({
            kv: this.kv,
            data: {}
          }).toPromise()
          records = (records || []).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime())
          this.excelExport.exportAsExcelFile(records, this.kv)
          records = null;

        }else{
          alert('No record !!!!')
        }
      }else{
        alert('password not correct!!')
        this.password = ''
      }
    })
  }

  private onCount(body: any) {
    return new Promise(resolve => {
      resolve(this.api.getCount(body).toPromise())
    })
  }

}
