package hamburgerStore;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;
import java.util.Scanner;

public class Manager {
   private String folderPath = "ledger";

   public Manager() {
      File folder = new File(folderPath);

      // 폴더가 없으면 생성
      if (!folder.exists()) {
         boolean success = folder.mkdirs(); // 상위 폴더까지 전부 생성
         if (!success) {
            System.out.println("폴더 생성 실패!");
         }
      }
   }

   public void managerMain(Scanner scan, List<Ingredient> list, LocalDateTime localDateTime) {
      System.out.print("비밀번호 : ");
      if (!"1234".equals(scan.nextLine())) {
         System.out.println("비밀번호가 틀렸습니다.");
         return;
      }

      while (true) {
         System.out.println("==관리자 메뉴를 선택하세요==");
         System.out.println("1.재료 등록 / 2. 재료 삭제 / 3. 재고 정리 / 4.결산 / 5. 조회 / 6. 나가기");

         int index = scanInt(scan);

         switch (index) {
         case 1:
            ingredientInsert(scan, list);
            break;
         case 2:
            ingredientDelete(scan, list);
            break;
         case 3:
            updateStock(scan, list);
            break;
         case 4:
            Settlement(list, localDateTime);
            break;
         case 5:
            read(scan);
            break;
         case 6:
            return;
         default:
            System.out.println("관리자 메뉴를 잘못 선택했습니다.");
         }
      }
   }

   // 재료 등록
   public void ingredientInsert(Scanner scan, List<Ingredient> list) {

      while (true) {
         System.out.println("===원자재 등록===");
         System.out.println("재료명 입력 >");
         String name = scan.next();
         int stock, cost, sale, count, kind;

         while (true) {
            System.out.println("구매원가>");
            cost = scanInt(scan);
            if (cost > 0) {
               break;
            }
            System.out.println("구매원가는 0보다 작을 수 없습니다.");
         }

         while (true) {
            System.out.println("판매가>");
            sale = scanInt(scan);
            if (sale > 0) {
               break;
            }
            System.out.println("판매가는 0보다 작을 수 없습니다.");
         }

         while (true) {
            System.out.println("구매 수량>");
            count = scanInt(scan);
            if (count > 0) {
               stock = count;
               break;
            }
            System.out.println("구매 수량은 0보다 작을 수 없습니다.");
         }

         while (true) {
            System.out.println("1.재료, 2.음료수");
            kind = scanInt(scan);
            if (kind == 1 || kind == 2) {
               break;
            }
            System.out.println("재료 종류는 1 또는 2를 선택해주세요.");
         }

         int chk = 0;
         for (Ingredient i : list) {
            if (i.getName().equals(name)) {
               i.setStock(stock);
               i.setCost(cost);
               i.setCount(count);
               i.setKind(kind);
               i.setSale(sale);
               i.setSaleCount(0);
               i.setKind(kind);
               chk = 1;
            }
         }

         if (chk != 1) {
            list.add(new Ingredient(name, stock, cost, sale, count, 0, kind));
         }

         System.out.println("종료(n)");
         if (scan.next().toLowerCase().equals("n")) {
            break;
         }

      }
   }

   // 재료 삭제
   public void ingredientDelete(Scanner scan, List<Ingredient> list) {
      System.out.println("===원자재 삭제===");
      System.out.println("재료명 입력 >");
      String name = scan.next();

      Iterator<Ingredient> iterator = list.iterator();
      while (iterator.hasNext()) {
         Ingredient ingredient = iterator.next();
         if (ingredient.getName().equals(name)) {
            iterator.remove();
            System.out.println("제거되었습니다.");
            return;
         }
      }
   }

   // 재고 정리
   public boolean updateStock(Scanner scan, List<Ingredient> list) {
      boolean change = false;

      int cnt = 1;
      for (Ingredient i : list) {
         System.out.printf("%-3d", cnt++);
         String str = "";
         str = String.format("%-4s", i.getName()).replace(' ', '\u3000');
         str += String.format(
               "재고 : %,10d  /  구매원가 : %,10d  /  판매가  : %,10d  /  구매수량 : %,10d  /  구매금액 : %,10d  /  판매수량 : %,10d  /  판매금액 : %,10d",
               i.getStock(), i.getCost(), i.getSale(), i.getCount(), i.getCost() * i.getCount(), i.getSaleCount(),
               i.getSale() * i.getSaleCount());
         System.out.println(str);
      }

      int index;
      while (true) {
         System.out.println("변경하실 재료를 선택해주세요.");
         index = scanInt(scan) - 1;
         if (index >= 0 && index < list.size()) {
            break;
         }
         System.out.println("유효하지 않은 재료번호입니다.");
      }
      Ingredient ingredient = list.get(index);

      while (true) {
         System.out.println("1. 이름 / 2. 재고 / 3. 구매원가 / 4. 판매가 / 5. 구매수량 / 6. 판매수량 / 7. 나가기");
         int input;
         while (true) {
            System.out.println("변경하실 항목을 선택해주세요.");
            input = scanInt(scan);

            if (input > 0 && input <= 7) {
               break;
            }
            System.err.println("유효하지 않은 항목번호입니다.");
         }

         if (input == 7) {
            return change;
         }

         switch (input) {
         case 1:
            System.out.print("이름 => ");
            ingredient.setName(scan.nextLine());
            change = true;
            break;
         case 2:
            int stock;
            while (true) {
               System.out.println("재고>");
               stock = scanInt(scan);
               if (stock > 0) {
                  break;
               }
               System.out.println("재고는 0보다 작을 수 없습니다.");
            }
            ingredient.setStock(stock);
            change = true;
            break;
         case 3:
            int cost;
            while (true) {
               System.out.println("구매원가>");
               cost = scanInt(scan);
               if (cost > 0) {
                  break;
               }
               System.out.println("구매원가는 0보다 작을 수 없습니다.");
            }
            ingredient.setCost(cost);
            change = true;
            break;
         case 4:
            int sale;
            while (true) {
               System.out.println("판매가>");
               sale = scanInt(scan);
               if (sale > 0) {
                  break;
               }
               System.out.println("판매가는 0보다 작을 수 없습니다.");
            }
            ingredient.setSale(sale);
            change = true;
            break;
         case 5:
            int count;
            while (true) {
               System.out.println("구매수량>");
               count = scanInt(scan);
               if (count > 0) {
                  break;
               }
               System.out.println("구매수량 0보다 작을 수 없습니다.");
            }
            ingredient.setCount(count);
            change = true;
            break;
         case 6:
            int saleCount;
            while (true) {
               System.out.println("판매수량>");
               saleCount = scanInt(scan);
               if (saleCount > 0) {
                  break;
               }
               System.out.println("판매수량 0보다 작을 수 없습니다.");
            }
            ingredient.setCount(saleCount);
            change = true;
            break;
         }
      }
   }

   // 결산 조회
   public void Settlement(List<Ingredient> list, LocalDateTime localDateTime) {
      
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
      String date = localDateTime.format(formatter);
      
      System.out.println(date + ": 구매/판매 내역");
      
      try (FileWriter fw = new FileWriter(folderPath + "\\" + date + ".txt", true)) {
         int sum = 0; // 총 구매금액
         int saleSum = 0; // 총 판매금액

         for (Ingredient i : list) {
            String str = "";
            str = String.format("%-4s", i.getName()).replace(' ', '\u3000');
            str += String.format(
                  "/ 재고 : %,10d  / 구매원가 : %,10d  /  판매가  : %,10d  /  구매수량 : %,10d  /  구매금액 : %,10d  /  판매수량 : %,10d  /  판매금액 : %,10d",
                  i.getStock(), i.getCost(), i.getSale(), i.getCount(), i.getCost() * i.getCount(),
                  i.getSaleCount(), i.getSale() * i.getSaleCount());
            sum += i.getCost() * i.getCount();
            saleSum += i.getSale() * i.getSaleCount();
            System.out.println(str);
            fw.write(str + "\n");
         }
         int profits = saleSum - sum;

         System.out.println("총 구매금액 : " + sum + ", 총 판매금액 : " + saleSum + ", 당일 수익 : " + profits);
         fw.write("총 구매금액 : " + sum + ", 총 판매금액 : " + saleSum + ", 당일 수익 : " + profits + "\n\n");
         System.out.println();

      } catch (IOException e) {
         System.out.println("장부파일을 불러올 수 없습니다.");
      }
   }
   
   //
   public void read(Scanner scan) {
      int input;
      while (true) {
         System.out.println("1. 영수증 / 2. 거래 장부 / 3. 나가기");
         input = scanInt(scan);

         if (input > 0 && input <= 3) {
            break;
         }
         System.out.println("유효하지 않은 번호입니다.");
         System.out.println();
      }
      
      switch (input) {
      case 1:
         System.out.println("조회하실 날짜를 입력하세요.");
         String date = scan.nextLine();
         try (BufferedReader br = new BufferedReader(new FileReader("transactions\\" + date + ".txt"))) {
            String line;
            while ((line = br.readLine()) != null) {
               System.out.println(line);
            }
         } catch (IOException e) {
            System.out.println("없는 파일입니다.");
            System.out.println();
         }
         break;
      case 2:
         System.out.println("조회하실 날짜를 입력하세요.");
         date = scan.nextLine();
         try (BufferedReader br = new BufferedReader(new FileReader(folderPath + "\\" + date + ".txt"))) {
            String line;
            while ((line = br.readLine()) != null) {
               System.out.println(line);
            }
         } catch (IOException e) {
            System.out.println("없는 파일입니다.");
            System.out.println();
         }
         break;
      case 3: return;
      }
   }
   

   // 구매수량 / 판매수량 초기화 / 당일 물품 구매
   public void nextDate(List<Ingredient> list) {
      for (Ingredient i : list) {
         i.setCount((int)(Math.random() * 100) + 50);
         i.setStock(i.getCount() + i.getStock());
         i.setSaleCount(0);
      }
   }

   // 숫자 입력 받기
   public int scanInt(Scanner scan) {
      while (true) {
         try {
            int i = scan.nextInt();
            scan.nextLine();
            return i;
         } catch (Exception e) {
            System.err.println("숫자만 입력하세요");
            scan.nextLine();
         }
      }
   }
}