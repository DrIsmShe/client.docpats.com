import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ProfilePatientHomePage() {
  const [articleCount, setArticleCount] = useState(0);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchArticleCount = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/api/count-articles-today`
        );

        console.log("Полный ответ сервера:", response);

        // ✅ Если response пустой, выходим
        if (!response || !response.data) {
          console.error("⚠️ Сервер вернул пустой ответ!");
          return;
        }

        setArticleCount(response.data.count || 0);
      } catch (error) {
        console.error(
          "Ошибка при получении количества статей:",
          error?.message || error
        );
      }
    };

    fetchArticleCount();
  }, []);

  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    const fetchTotalArticles = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/api/count-articles-all`
        );

        if (!response || !response.data) {
          console.error("⚠️ Сервер вернул пустой ответ!");
          return;
        }

        setTotalArticles(response.data.count || 0);
      } catch (error) {
        console.error(
          "Ошибка при получении общего количества статей:",
          error?.message || error
        );
      }
    };

    fetchTotalArticles();
  }, []);

  const [totalDoctors, setTotalDoctors] = useState(0);

  useEffect(() => {
    const fetchTotalDoctors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/api/count-doctors-all`
        );

        if (!response || !response.data) {
          console.error("⚠️ Сервер вернул пустой ответ!");
          return;
        }

        setTotalDoctors(response.data.count || 0);
      } catch (error) {
        console.error(
          "Ошибка при получении общего количества докторов:",
          error?.message || error
        );
      }
    };

    fetchTotalDoctors();
  }, []);
  return (
    <div>
      {" "}
      <section className="section dashboard">
        <div className="row">
          <div className="col-lg-8">
            <div className="row">
              <div className="col-xxl-4 col-md-6">
                <div className="card info-card sales-card">
                  <div className="card-body">
                    <h5 className="card-title">
                      Статьи <span>| Сегодня</span>
                    </h5>

                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i className="bi bi-file-text"></i>
                      </div>
                      <div className="ps-3">
                        <h6>{articleCount}</h6>
                        {/* <span className="text-success small pt-1 fw-bold">
                            +12%
                          </span>
                          <span className="text-muted small pt-2 ps-1">рост</span> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xxl-4 col-md-6">
                <div className="card info-card revenue-card">
                  <div className="card-body">
                    <h5 className="card-title">
                      Всего статей <span>| В базе</span>
                    </h5>

                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i className="bi bi-file-earmark-text"></i>
                      </div>
                      <div className="ps-3">
                        <h6>{totalArticles}</h6>
                        <span className="text-success small pt-1 fw-bold">
                          +{articleCount}
                        </span>
                        <span className="text-muted small pt-2 ps-1">
                          сегодня
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-4 col-xl-12">
                <div className="card info-card customers-card">
                  <div className="card-body">
                    <h5 className="card-title">
                      Доктора <span>| В базе</span>
                    </h5>

                    <div className="d-flex align-items-center">
                      <div className="card-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i className="bi bi-people"></i>
                      </div>
                      <div className="ps-3">
                        <h6>{totalDoctors}</h6>
                        <span className="text-success small pt-1 fw-bold">
                          +{totalDoctors > 0 ? 5 : 0}%
                        </span>
                        <span className="text-muted small pt-2 ps-1">
                          новые доктора
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="card col-6"
                style={{ width: "97%", margin: "5px" }}
              >
                <div className="card-body pb-0">
                  <h5 className="card-title">
                    News &amp; Updates <span>| Today</span>
                  </h5>

                  <div className="news">
                    <div className="post-item clearfix">
                      <img src="assets/img/news-1.jpg" alt="" />
                      <h4>
                        <Link href="#">Nihil blanditiis at in nihil autem</Link>
                      </h4>
                      <p>
                        Sit recusandae non aspernatur laboriosam. Quia enim
                        eligendi sed ut harum...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-2.jpg" alt="" />
                      <h4>
                        <Link href="#">Quidem autem et impedit</Link>
                      </h4>
                      <p>
                        Illo nemo neque maiores vitae officiis cum eum turos
                        elan dries werona nande...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-3.jpg" alt="" />
                      <h4>
                        <Link href="#">
                          Id quia et et ut maxime similique occaecati ut
                        </Link>
                      </h4>
                      <p>
                        Fugiat voluptas vero eaque accusantium eos. Consequuntur
                        sed ipsam et totam...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-4.jpg" alt="" />
                      <h4>
                        <Link href="#">Laborum corporis quo dara net para</Link>
                      </h4>
                      <p>
                        Qui enim quia optio. Eligendi aut asperiores enim
                        repellendusvel rerum cuder...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-5.jpg" alt="" />
                      <h4>
                        <Link href="#">
                          Et dolores corrupti quae illo quod dolor
                        </Link>
                      </h4>
                      <p>
                        Odit ut eveniet modi reiciendis. Atque cupiditate libero
                        beatae dignissimos eius...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="card col-6"
                style={{ width: "97%", margin: "5px" }}
              >
                <div className="filter">
                  <Link className="icon" href="#" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots"></i>
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li className="dropdown-header text-start">
                      <h6>Filter</h6>
                    </li>

                    <li>
                      <Link className="dropdown-item" href="#">
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Year
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="card-body pb-0">
                  <h5 className="card-title">
                    News &amp; Updates <span>| Today</span>
                  </h5>

                  <div className="news">
                    <div className="post-item clearfix">
                      <img src="assets/img/news-1.jpg" alt="" />
                      <h4>
                        <Link href="#">Nihil blanditiis at in nihil autem</Link>
                      </h4>
                      <p>
                        Sit recusandae non aspernatur laboriosam. Quia enim
                        eligendi sed ut harum...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-2.jpg" alt="" />
                      <h4>
                        <Link href="#">Quidem autem et impedit</Link>
                      </h4>
                      <p>
                        Illo nemo neque maiores vitae officiis cum eum turos
                        elan dries werona nande...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-3.jpg" alt="" />
                      <h4>
                        <Link href="#">
                          Id quia et et ut maxime similique occaecati ut
                        </Link>
                      </h4>
                      <p>
                        Fugiat voluptas vero eaque accusantium eos. Consequuntur
                        sed ipsam et totam...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-4.jpg" alt="" />
                      <h4>
                        <Link href="#">Laborum corporis quo dara net para</Link>
                      </h4>
                      <p>
                        Qui enim quia optio. Eligendi aut asperiores enim
                        repellendusvel rerum cuder...
                      </p>
                    </div>

                    <div className="post-item clearfix">
                      <img src="assets/img/news-5.jpg" alt="" />
                      <h4>
                        <Link href="#">
                          Et dolores corrupti quae illo quod dolor
                        </Link>
                      </h4>
                      <p>
                        Odit ut eveniet modi reiciendis. Atque cupiditate libero
                        beatae dignissimos eius...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card">
                <div className="filter">
                  <Link className="icon" href="#" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots"></i>
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li className="dropdown-header text-start">
                      <h6>Filter</h6>
                    </li>

                    <li>
                      <Link className="dropdown-item" href="#">
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Year
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="card-body">
                  <h5 className="card-title">
                    Reports <span>/Today</span>
                  </h5>

                  <div id="reportsChart"></div>

                  {/* {document.addEventListener("DOMContentLoaded", () => {
                          new ApexCharts(
                            document.querySelector("#reportsChart"),
                            {
                              series: [
                                {
                                  name: "Sales",
                                  data: [31, 40, 28, 51, 42, 82, 56],
                                },
                                {
                                  name: "Revenue",
                                  data: [11, 32, 45, 32, 34, 52, 41],
                                },
                                {
                                  name: "Customers",
                                  data: [15, 11, 32, 18, 9, 24, 11],
                                },
                              ],
                              chart: {
                                height: 350,
                                type: "area",
                                toolbar: {
                                  show: false,
                                },
                              },
                              markers: {
                                size: 4,
                              },
                              colors: ["#4154f1", "#2eca6a", "#ff771d"],
                              fill: {
                                type: "gradient",
                                gradient: {
                                  shadeIntensity: 1,
                                  opacityFrom: 0.3,
                                  opacityTo: 0.4,
                                  stops: [0, 90, 100],
                                },
                              },
                              dataLabels: {
                                enabled: false,
                              },
                              stroke: {
                                curve: "smooth",
                                width: 2,
                              },
                              xaxis: {
                                type: "datetime",
                                categories: [
                                  "2018-09-19T00:00:00.000Z",
                                  "2018-09-19T01:30:00.000Z",
                                  "2018-09-19T02:30:00.000Z",
                                  "2018-09-19T03:30:00.000Z",
                                  "2018-09-19T04:30:00.000Z",
                                  "2018-09-19T05:30:00.000Z",
                                  "2018-09-19T06:30:00.000Z",
                                ],
                              },
                              tooltip: {
                                x: {
                                  format: "dd/MM/yy HH:mm",
                                },
                              },
                            }
                          ).render();
                        })} */}
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card recent-sales overflow-auto">
                <div className="filter">
                  <Link className="icon" href="#" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots"></i>
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li className="dropdown-header text-start">
                      <h6>Filter</h6>
                    </li>

                    <li>
                      <Link className="dropdown-item" href="#">
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Year
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="card-body">
                  <h5 className="card-title">
                    Recent Sales <span>| Today</span>
                  </h5>

                  <table className="table table-borderless datatable">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Customer</th>
                        <th scope="col">Product</th>
                        <th scope="col">Price</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">
                          <Link href="#">#2457</Link>
                        </th>
                        <td>Brandon Jacob</td>
                        <td>
                          <Link href="#" className="text-primary">
                            At praesentium minu
                          </Link>
                        </td>
                        <td>$64</td>
                        <td>
                          <span className="badge bg-success">Approved</span>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">#2147</Link>
                        </th>
                        <td>Bridie Kessler</td>
                        <td>
                          <Link href="#" className="text-primary">
                            Blanditiis dolor omnis similique
                          </Link>
                        </td>
                        <td>$47</td>
                        <td>
                          <span className="badge bg-warning">Pending</span>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">#2049</Link>
                        </th>
                        <td>Ashleigh Langosh</td>
                        <td>
                          <Link href="#" className="text-primary">
                            At recusandae consectetur
                          </Link>
                        </td>
                        <td>$147</td>
                        <td>
                          <span className="badge bg-success">Approved</span>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">#2644</Link>
                        </th>
                        <td>Angus Grady</td>
                        <td>
                          <Link href="#" className="text-primar">
                            Ut voluptatem id earum et
                          </Link>
                        </td>
                        <td>$67</td>
                        <td>
                          <span className="badge bg-danger">Rejected</span>
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">#2644</Link>
                        </th>
                        <td>Raheem Lehner</td>
                        <td>
                          <Link href="#" className="text-primary">
                            Sunt similique distinctio
                          </Link>
                        </td>
                        <td>$165</td>
                        <td>
                          <span className="badge bg-success">Approved</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card top-selling overflow-auto">
                <div className="filter">
                  <Link className="icon" href="#" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots"></i>
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <li className="dropdown-header text-start">
                      <h6>Filter</h6>
                    </li>

                    <li>
                      <Link className="dropdown-item" href="#">
                        Today
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Month
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="#">
                        This Year
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="card-body pb-0">
                  <h5 className="card-title">
                    Top Selling <span>| Today</span>
                  </h5>

                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th scope="col">Preview</th>
                        <th scope="col">Product</th>
                        <th scope="col">Price</th>
                        <th scope="col">Sold</th>
                        <th scope="col">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">
                          <Link href="#">
                            <img src="assets/img/product-1.jpg" alt="" />
                          </Link>
                        </th>
                        <td>
                          <Link href="#" className="text-primary fw-bold">
                            Ut inventore ipsa voluptas nulla
                          </Link>
                        </td>
                        <td>$64</td>
                        <td className="fw-bold">124</td>
                        <td>$5,828</td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">
                            <img src="assets/img/product-2.jpg" alt="" />
                          </Link>
                        </th>
                        <td>
                          <Link href="#" className="text-primary fw-bold">
                            Exercitationem similique doloremque
                          </Link>
                        </td>
                        <td>$46</td>
                        <td className="fw-bold">98</td>
                        <td>$4,508</td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">
                            <img src="assets/img/product-3.jpg" alt="" />
                          </Link>
                        </th>
                        <td>
                          <Link href="#" className="text-primary fw-bold">
                            Doloribus nisi exercitationem
                          </Link>
                        </td>
                        <td>$59</td>
                        <td className="fw-bold">74</td>
                        <td>$4,366</td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">
                            <img src="assets/img/product-4.jpg" alt="" />
                          </Link>
                        </th>
                        <td>
                          <Link href="#" className="text-primary fw-bold">
                            Officiis quaerat sint rerum error
                          </Link>
                        </td>
                        <td>$32</td>
                        <td className="fw-bold">63</td>
                        <td>$2,016</td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <Link href="#">
                            <img src="assets/img/product-5.jpg" alt="" />
                          </Link>
                        </th>
                        <td>
                          <Link href="#" className="text-primary fw-bold">
                            Sit unde debitis delectus repellendus
                          </Link>
                        </td>
                        <td>$79</td>
                        <td className="fw-bold">41</td>
                        <td>$3,239</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="filter">
                <Link className="icon" href="#" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots"></i>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <li className="dropdown-header text-start">
                    <h6>Filter</h6>
                  </li>

                  <li>
                    <Link className="dropdown-item" href="#">
                      Today
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Month
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Year
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="card-body">
                <h5 className="card-title">
                  Recent Activity <span>| Today</span>
                </h5>

                <div className="activity">
                  <div className="activity-item d-flex">
                    <div className="activite-label">32 min</div>
                    <i className="bi bi-circle-fill activity-badge text-success align-self-start"></i>
                    <div className="activity-content">
                      Quia quae rerum
                      <Link href="#" className="fw-bold text-dark">
                        explicabo officiis
                      </Link>
                      beatae
                    </div>
                  </div>

                  <div className="activity-item d-flex">
                    <div className="activite-label">56 min</div>
                    <i className="bi bi-circle-fill activity-badge text-danger align-self-start"></i>
                    <div className="activity-content">
                      Voluptatem blanditiis blanditiis eveniet
                    </div>
                  </div>

                  <div className="activity-item d-flex">
                    <div className="activite-label">2 hrs</div>
                    <i className="bi bi-circle-fill activity-badge text-primary align-self-start"></i>
                    <div className="activity-content">
                      Voluptates corrupti molestias voluptatem
                    </div>
                  </div>

                  <div className="activity-item d-flex">
                    <div className="activite-label">1 day</div>
                    <i className="bi bi-circle-fill activity-badge text-info align-self-start"></i>
                    <div className="activity-content">
                      Tempore autem saepe
                      <Link href="#" className="fw-bold text-dark">
                        occaecati voluptatem
                      </Link>
                      tempore
                    </div>
                  </div>

                  <div className="activity-item d-flex">
                    <div className="activite-label">2 days</div>
                    <i className="bi bi-circle-fill activity-badge text-warning align-self-start"></i>
                    <div className="activity-content">
                      Est sit eum reiciendis exercitationem
                    </div>
                  </div>

                  <div className="activity-item d-flex">
                    <div className="activite-label">4 weeks</div>
                    <i className="bi bi-circle-fill activity-badge text-muted align-self-start"></i>
                    <div className="activity-content">
                      Dicta dolorem harum nulla eius. Ut quidem quidem sit quas
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="filter">
                <Link className="icon" href="#" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots"></i>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <li className="dropdown-header text-start">
                    <h6>Filter</h6>
                  </li>

                  <li>
                    <Link className="dropdown-item" href="#">
                      Today
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Month
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Year
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="card-body pb-0">
                <h5 className="card-title">
                  Budget Report <span>| This Month</span>
                </h5>

                <div
                  id="budgetChart"
                  style={{ minHeight: "400px" }}
                  className="echart"
                ></div>

                {/* {document.addEventListener("DOMContentLoaded", () => {
                      var budgetChart = echarts
                        .init(document.querySelector("#budgetChart"))
                        .setOption({
                          legend: {
                            data: ["Allocated Budget", "Actual Spending"],
                          },
                          radar: {
                            // shape: 'circle',
                            indicator: [
                              {
                                name: "Sales",
                                max: 6500,
                              },
                              {
                                name: "Administration",
                                max: 16000,
                              },
                              {
                                name: "Information Technology",
                                max: 30000,
                              },
                              {
                                name: "Customer Support",
                                max: 38000,
                              },
                              {
                                name: "Development",
                                max: 52000,
                              },
                              {
                                name: "Marketing",
                                max: 25000,
                              },
                            ],
                          },
                          series: [
                            {
                              name: "Budget vs spending",
                              type: "radar",
                              data: [
                                {
                                  value: [4200, 3000, 20000, 35000, 50000, 18000],
                                  name: "Allocated Budget",
                                },
                                {
                                  value: [
                                    5000, 14000, 28000, 26000, 42000, 21000,
                                  ],
                                  name: "Actual Spending",
                                },
                              ],
                            },
                          ],
                        });
                    })} */}
              </div>
            </div>
            <div className="card">
              <div className="filter">
                <Link className="icon" href="#" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots"></i>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <li className="dropdown-header text-start">
                    <h6>Filter</h6>
                  </li>

                  <li>
                    <Link className="dropdown-item" href="#">
                      Today
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Month
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Year
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="card-body pb-0">
                <h5 className="card-title">
                  Website Traffic <span>| Today</span>
                </h5>

                <div
                  id="trafficChart"
                  style={{ minHeight: "400px" }}
                  className="echart"
                ></div>

                {/* {document.addEventListener("DOMContentLoaded", () => {
                      echarts
                        .init(document.querySelector("#trafficChart"))
                        .setOption({
                          tooltip: {
                            trigger: "item",
                          },
                          legend: {
                            top: "5%",
                            left: "center",
                          },
                          series: [
                            {
                              name: "Access From",
                              type: "pie",
                              radius: ["40%", "70%"],
                              avoidLabelOverlap: false,
                              label: {
                                show: false,
                                position: "center",
                              },
                              emphasis: {
                                label: {
                                  show: true,
                                  fontSize: "18",
                                  fontWeight: "bold",
                                },
                              },
                              labelLine: {
                                show: false,
                              },
                              data: [
                                {
                                  value: 1048,
                                  name: "Search Engine",
                                },
                                {
                                  value: 735,
                                  name: "Direct",
                                },
                                {
                                  value: 580,
                                  name: "Email",
                                },
                                {
                                  value: 484,
                                  name: "Union Ads",
                                },
                                {
                                  value: 300,
                                  name: "Video Ads",
                                },
                              ],
                            },
                          ],
                        });
                    })} */}
              </div>
            </div>
            <div className="card">
              <div className="filter">
                <Link className="icon" href="#" data-bs-toggle="dropdown">
                  <i className="bi bi-three-dots"></i>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <li className="dropdown-header text-start">
                    <h6>Filter</h6>
                  </li>

                  <li>
                    <Link className="dropdown-item" href="#">
                      Today
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Month
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      This Year
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="card-body pb-0">
                <h5 className="card-title">
                  News &amp; Updates <span>| Today</span>
                </h5>

                <div className="news">
                  <div className="post-item clearfix">
                    <img src="assets/img/news-1.jpg" alt="" />
                    <h4>
                      <Link href="#">Nihil blanditiis at in nihil autem</Link>
                    </h4>
                    <p>
                      Sit recusandae non aspernatur laboriosam. Quia enim
                      eligendi sed ut harum...
                    </p>
                  </div>

                  <div className="post-item clearfix">
                    <img src="assets/img/news-2.jpg" alt="" />
                    <h4>
                      <Link href="#">Quidem autem et impedit</Link>
                    </h4>
                    <p>
                      Illo nemo neque maiores vitae officiis cum eum turos elan
                      dries werona nande...
                    </p>
                  </div>

                  <div className="post-item clearfix">
                    <img src="assets/img/news-3.jpg" alt="" />
                    <h4>
                      <Link href="#">
                        Id quia et et ut maxime similique occaecati ut
                      </Link>
                    </h4>
                    <p>
                      Fugiat voluptas vero eaque accusantium eos. Consequuntur
                      sed ipsam et totam...
                    </p>
                  </div>

                  <div className="post-item clearfix">
                    <img src="assets/img/news-4.jpg" alt="" />
                    <h4>
                      <Link href="#">Laborum corporis quo dara net para</Link>
                    </h4>
                    <p>
                      Qui enim quia optio. Eligendi aut asperiores enim
                      repellendusvel rerum cuder...
                    </p>
                  </div>

                  <div className="post-item clearfix">
                    <img src="assets/img/news-5.jpg" alt="" />
                    <h4>
                      <Link href="#">
                        Et dolores corrupti quae illo quod dolor
                      </Link>
                    </h4>
                    <p>
                      Odit ut eveniet modi reiciendis. Atque cupiditate libero
                      beatae dignissimos eius...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
