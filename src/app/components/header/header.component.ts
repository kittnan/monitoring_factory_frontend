import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'src/app/api.service';
import { KvService } from '../kv.service';
import { PercentRecordsService } from '../percent-records.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  password: any
  // percent: any
  progressColor: any
  kv!: string;
  percent!: number

  constructor(
    public dialog: MatDialog,
    private api: ApiService,
    private kvService: KvService,
    private percentService: PercentRecordsService
  ) {
    this.percentService.getPercent().subscribe(percent => this.percent = percent),
      this.progressColor = 'primary',
      this.kvService.kv$.subscribe(kv => this.kv = kv)
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
    this.dialog.open(content)
  }

  onDownload() {
    const data = {
      password: this.password
    }
    this.api.download(data).subscribe(async res => {
      if (res) {
        const body = {
          kv: this.kv
        }
        const countRecords: any = await this.onCount(body)
        if (countRecords > 0) {
          let postArr: any[] = []
          for (let i = 0; i < countRecords; i += 1000) {
            postArr.push(
              this.api.postKvRecords({
                kv:this.kv,
                data:{
                  seq: {
                    $gte: i+1,
                     $lte: i+1000
                  }
                }
              }).toPromise()
            )
          }
          const data:any = await Promise.all(postArr)
          console.log(data);
          let postResArr :any[] = []
          for (const d of data) {
            postResArr = postResArr.concat(d)
          }
          console.log(postResArr);
        }
      }
    })
  }

  private onCount(body: any) {
    return new Promise(resolve => {
      resolve(this.api.getCount(body).toPromise())
    })
  }

}
